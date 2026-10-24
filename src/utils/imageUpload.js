const MAX_DATA_URL_LENGTH = 600_000

export function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) {
      reject(new Error('Please choose a PNG or JPG image.'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read file.'))
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string' || result.length > MAX_DATA_URL_LENGTH) {
        reject(new Error('Image is too large. Use a file under about 400 KB.'))
        return
      }
      resolve(result)
    }
    reader.readAsDataURL(file)
  })
}
