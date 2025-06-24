import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { HTTPMethod, RoleName } from 'src/shared/constants/role.constant'
import { PrismaService } from 'src/shared/services/prisma.service'

const prisma = new PrismaService()

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  await app.listen(3000)
  const server = app.getHttpAdapter().getInstance()
  const router = server.router
  const permissionsInDb = await prisma.permission.findMany({
    where: {
      deletedAt: null,
    },
  })

  const availableRoutes: { path: string; method: keyof typeof HTTPMethod; name: string; module: string }[] = router.stack
    .map((layer) => {
      if (layer.route) {
        const path = layer.route?.path
        const method = String(layer.route?.stack[0].method).toUpperCase() as keyof typeof HTTPMethod
        const module = path.split('/')[1].toUpperCase()
        return {
          path,
          method,
          name: `${method}-${path}`,
          module,
        }
      }
    })
    .filter((item) => item !== undefined)
  // Tạo object permissionInDbMap với key là [method-path]
  const permissionInDbMap: Record<string, (typeof permissionsInDb)[0]> = permissionsInDb.reduce((acc, curr) => {
    acc[`${curr.method}-${curr.path}`] = curr
    return acc
  }, {})

  // Tạo object availableRoutesMap với key là [method-path]
  const availableRoutesMap: Record<string, (typeof availableRoutes)[0]> = availableRoutes.reduce((acc, curr) => {
    acc[`${curr.method}-${curr.path}`] = curr
    return acc
  }, {})

  // Tìm permissions trong database mà không có trong availableRoutesMap
  const permissionsToDelete = permissionsInDb.filter((item) => !availableRoutesMap[`${item.method}-${item.path}`])

  // Xóa permissions không có trong availableRoutesMap
  if (permissionsToDelete.length > 0) {
    const deleteResult = await prisma.permission.deleteMany({
      where: {
        id: { in: permissionsToDelete.map((item) => item.id) },
      },
    })
    console.log(`Deleted ${deleteResult.count} permissions`)
  } else {
    console.log('No permissions to delete')
  }

  // Tìm routes mà không tổn tại trong permissionsInDb
  const routesToAdd = availableRoutes.filter((item) => {
    return !permissionInDbMap[`${item.method}-${item.path}`]
  })

  // Tạo routes mà không tồn tại trong permissionsInDb
  if (routesToAdd.length > 0) {
    const permissionsToAdd = await prisma.permission.createMany({
      data: routesToAdd,
      skipDuplicates: true,
    })
    console.log(`Created ${permissionsToAdd.count} permissions`)
  } else {
    console.log('No routes to add')
  }

  // Lấy lại permissions trong database
  const updatedPermissionsInDb = await prisma.permission.findMany({
    where: {
      deletedAt: null,
    },
  })
  // Cập nhật lại các permissions trong Admin Role
  const adminRole = await prisma.role.findFirstOrThrow({
    where: {
      name: RoleName.Admin,
      deletedAt: null,
    },
  })
  await prisma.role.update({
    where: {
      id: adminRole.id,
    },
    data: {
      permissions: {
        set: updatedPermissionsInDb.map((item) => ({ id: item.id })),
      },
    },
  })

  process.exit(0)
}
bootstrap()
