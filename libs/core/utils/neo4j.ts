import { ConfirmedSignatureInfo } from '@solana/web3.js'

/**
 * Clear object from null values
 * Clear quotas from keys
 */
export function clearStringify(object: object) {
  Object.keys(object).forEach((key) => {
    if (object[key] === null) {
      delete object[key]
    }
  })
  return JSON.stringify(object).replace(/"([^"]+)":/g, '$1:')
}

/**
 * Get object then left only allowed keys
 */
export function objectFilter(raw: object, allowed: string[]): object {
  return Object.keys(raw)
    .filter(key => allowed.includes(key))
    .reduce((obj, key) => {
      obj[key] = raw[key]
      return obj
    }, {})
}

/**
 * Get object convert to "key: ke$y, key1: $key1" string
 */
export function getRequestParameters(payload: object) {
  return Object.keys(payload)
    .reduce((pv, cv) => `${pv}${cv}: $${cv},`, '')
    .slice(0, -1)
}

/**
 * Get object convert to "key: value, key1: $key1" string
 */
export function getRequest(payload: object) {
  return Object.keys(payload)
    .reduce((pv, cv) => `${pv}${cv}: $${cv},`, '')
    .slice(0, -1)
}

/**
 * Get request for multiple upsert
 */
export function getMergeArrayRequest(payload: ConfirmedSignatureInfo[], graphName: string) {
  const string = payload.reduce((pv, cv, index) => {
    // clear object from null values
    Object.keys(cv).forEach((key) => {
      if (cv[key] === null) {
        delete cv[key]
      }
      delete cv.err // TODO ERR CHECK
    })

    const clearJsonString = JSON.stringify(cv).replace(/"([^"]+)":/g, '$1:') // clear quotas from keys

    return `${pv}
        MERGE (u${index}: ${graphName} ${clearJsonString})`
  }, '')

  return {
    string,
    params: payload.map((p, index) => `u${index}`),
  }
}

/**
 * Get request for multiple merge relations by alias
 */
export function getRelationsRequestByAlias(params: string[], alias: string, relationAlias: string) {
  return params.reduce((pv, cv) => `${pv}
        MERGE (${alias})-[:${relationAlias}]->(${cv})`, '')
}

/**
 * Return batch string for JSON
 */
export function recursiveRequestString(current: any, key: string): string | undefined {
  const r = (current: any, key: string, parentKey: string | undefined = undefined, iterator = 0, parentIterator = 0, requestString = '') => {
    // MANY GRAPHS
    if (Array.isArray(current) && current.length) {
      if (Array.isArray(current[0])) {
        return
      } // TODO what happen if its array of arrays
      if (typeof current[0] === 'object') {
        current.forEach((entity) => {
          const { string, updatedIterator } = r(entity, key, parentKey, iterator, parentIterator)
          requestString += string
          iterator = updatedIterator
        })
      } else if (parentKey) {
        current.forEach((entity) => {
          iterator++

          if (typeof entity === 'string') {
            entity = entity.replace(/["']/g, '\'')
          }

          requestString += `MERGE (u${iterator}:${key} {labelName: "${key}", data: "${entity}"})\n`
          requestString += `MERGE (u${parentIterator})-[:HAS]->(u${iterator})\n`
        })
      }
    }
    // SINGLE GRAPH
    if (current && typeof current === 'object' && Object.keys(current).length) {
      current.labelName = key
      iterator++
      if (current) {
        current.___id___ = iterator
      }

      const primitiveKeys = []
      const otherTypeKeys = []

      for (const currentKey in current) {
        if (['string', 'number', 'boolean'].includes(typeof current[currentKey]) && currentKey !== '___id___') {
          primitiveKeys.push(currentKey)
        } else if (current[currentKey]) {
          otherTypeKeys.push(currentKey)
        }
      }

      if (primitiveKeys.length) {
        const filteredObject = objectFilter(current, primitiveKeys)

        // CREATE GRAPH
        requestString += `MERGE (u${iterator}:${key} ${clearStringify(filteredObject)})\n`

        if (parentKey) {
          requestString += `MERGE (u${parentIterator})-[:HAS]->(u${iterator})\n`
        }
      }

      // CREATE CHILD GRAPH
      if (otherTypeKeys.length) {
        otherTypeKeys.forEach((otherTypeKey) => {
          const { string, updatedIterator } = r(current[otherTypeKey], otherTypeKey, key, iterator, current.___id___)
          requestString += string
          iterator = updatedIterator
        })
      }
    }

    return { string: requestString, updatedIterator: iterator }
  }

  return r(current, key).string
}
