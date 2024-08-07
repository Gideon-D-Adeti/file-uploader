const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createUser (firstName, lastName, username, password) {
  try {
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        username,
        password
      }
    })

    return user
  } catch (error) {
    console.error('Error adding user:', error)
    throw error
  }
}

async function checkUsernameExists (username) {
  try {
    const user = await prisma.user.findUnique({
      where: { username }
    })
    return user !== null // returns true if user exists, false otherwise
  } catch (error) {
    console.error('Error checking username existence:', error)
    throw error
  }
}

async function findUser (method, value) {
  try {
    let user

    if (method === 'username') {
      user = await prisma.user.findUnique({
        where: { username: value }
      })
    } else if (method === 'id') {
      user = await prisma.user.findUnique({
        where: { id: value }
      })
    } else {
      throw new Error('Invalid method. Use "username" or "id".')
    }

    return user
  } catch (error) {
    console.error('Error finding user:', error)
    throw error
  }
}

async function createHomeFolder (userId) {
  try {
    await prisma.folder.create({
      data: {
        name: 'Home',
        userId
      }
    })
  } catch (error) {
    console.error('Error creating default folder:', error)
    throw error
  }
}

async function findFolder (folderId) {
  try {
    const folder = await prisma.folder.findUnique({
      where: {
        id: folderId
      },
      include: {
        subfolders: true,
        files: true,
        parent: {
          include: {
            parent: {
              include: {
                parent: {
                  include: {
                    parent: true
                  }
                }
              }
            }
          }
        }
      }
    })

    return folder
  } catch (error) {
    console.error(`Error finding folder with ID ${folderId}:`, error)
    throw error
  }
}

async function createFile (name, path, folderId, size) {
  try {
    await prisma.file.create({
      data: {
        name,
        path,
        folderId,
        size
      }
    })
  } catch (error) {
    console.error('Error creating file:', error)
    throw error
  }
}

async function createFolder (name, userId, parentId) {
  try {
    await prisma.folder.create({
      data: {
        name,
        userId,
        parentId
      }
    })
  } catch (error) {
    console.error('Error creating folder:', error)
    throw error
  }
}

async function checkFilenameExist (name, folderId) {
  try {
    const file = await prisma.file.findFirst({
      where: { name, folderId }
    })
    return file !== null
  } catch (error) {
    console.error('Error checking file existence:', error)
    throw error
  }
}

async function checkFoldernameExist (name, parentId) {
  try {
    const folder = await prisma.folder.findFirst({
      where: { name, parentId }
    })
    return folder !== null
  } catch (error) {
    console.error('Error checking folder existence:', error)
    throw error
  }
}

async function findHomeFolderId (userId) {
  try {
    const homeFolder = await prisma.folder.findFirst({
      where: {
        userId,
        parentId: null
      }
    })

    return homeFolder.id
  } catch (error) {
    console.error('Error finding home folder:', error)
    throw error
  }
}

async function findFolderUserId (folderId) {
  try {
    const folder = await prisma.folder.findUnique({
      where: {
        id: folderId
      },
      select: {
        userId: true
      }
    })

    if (!folder) {
      throw new Error(`Folder with ID ${folderId} not found`)
    }

    return folder.userId
  } catch (error) {
    console.error('Error finding userId for folder:', error)
    throw error
  }
}

async function findDescendantFolders (folderId) {
  const descendants = []

  async function findChildren (parentId) {
    const subfolders = await prisma.folder.findMany({
      where: { parentId }
    })

    for (const subfolder of subfolders) {
      descendants.push(subfolder.id)
      await findChildren(subfolder.id)
    }
  }

  await findChildren(folderId)
  return descendants
}

async function findParentFolders (userId, folderId) {
  try {
    const descendants = await findDescendantFolders(folderId)
    descendants.push(folderId)

    const folders = await prisma.folder.findMany({
      where: {
        userId,
        id: { notIn: descendants }
      }
    })

    return folders
  } catch (error) {
    console.error('Error fetching parent folders:', error)
    throw error
  }
}

async function updateFolder (folderId, newName, newParentId) {
  try {
    const updatedFolder = await prisma.folder.update({
      where: { id: folderId },
      data: {
        name: newName,
        parentId: newParentId || null
      }
    })
    return updatedFolder
  } catch (error) {
    console.error(`Error updating folder with ID ${folderId}:`, error)
    throw error
  }
}

async function deleteFolder (folderId) {
  try {
    // Delete files in the folder
    await prisma.file.deleteMany({
      where: { folderId }
    })

    // Find and delete subfolders recursively
    const subfolders = await prisma.folder.findMany({
      where: { parentId: folderId }
    })

    for (const subfolder of subfolders) {
      await deleteFolder(subfolder.id)
    }

    // Delete share links associated with the folder
    await prisma.shareLink.deleteMany({
      where: { folderId }
    })

    // Delete the folder itself
    await prisma.folder.delete({
      where: { id: folderId }
    })
  } catch (error) {
    console.error(`Error deleting folder with ID ${folderId}:`, error)
    throw error
  }
}

async function findFile (fileId) {
  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    })

    return file
  } catch (error) {
    console.error('Error finding file:', error)
    throw error
  }
}

async function createShareLink (folderId, expiresAt) {
  try {
    const shareLink = await prisma.shareLink.create({
      data: {
        folderId,
        expiresAt
      }
    })

    return shareLink
  } catch (error) {
    console.error('Error creating share link:', error)
    throw error
  }
}

async function findShareLink (shareLinkId) {
  try {
    const shareLink = await prisma.shareLink.findUnique({
      where: { id: shareLinkId }
    })

    return shareLink
  } catch (error) {
    console.error('Error finding share link:', error)
    throw error
  }
}

module.exports = {
  createUser,
  checkUsernameExists,
  findUser,
  createHomeFolder,
  findFolder,
  createFile,
  createFolder,
  checkFilenameExist,
  checkFoldernameExist,
  findHomeFolderId,
  findFolderUserId,
  findParentFolders,
  updateFolder,
  deleteFolder,
  findFile,
  createShareLink,
  findShareLink
}
