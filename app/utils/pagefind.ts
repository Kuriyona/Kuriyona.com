export async function reinitPagefind() {
  try {
    const pagefindImport = new Function('return import("/pagefind/pagefind.js")')
    const pagefind = await pagefindImport()
    await pagefind.destroy()
    await pagefind.init()
  } catch {
    // PageFind index not yet available (dev mode)
  }
}
