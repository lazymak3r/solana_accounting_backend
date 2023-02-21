export function chunk(arr: any[], size: number) {
  return arr.reduce((acc, e, i) => i % size ? acc[acc.length - 1].push(e) : acc.push([e], acc), [])
}
