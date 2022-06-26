import { createElement, createContext, useEffect, useState, useContext } from 'react'
import { isObservable } from '@x/observable'

const instanceContext = createContext({})

export const HostProvider = ({ consumer, component, loading = 'Loading...' }) => {
  const [host, setHost] = useState()

  useEffect(() => {
    consumer.connect().then(host => setHost(host))
  }, [consumer])

  return createElement(instanceContext.Provider, {
    value: { host },
    children: host ? createElement(component, { host }) : loading
  })
}

export const useHost = work => {
  const { host } = useContext(instanceContext)
  const [value, setValue] = useState()

  useEffect(() => {
    const promise = Promise.resolve(work(host))
    promise.then(result => {
      if(isObservable(result)) {
        setValue(result())
        result.subscribe(setValue)
      } else {
        setValue(result)
      }
    })

    return () => {
      promise.then(result => {
        if(isObservable(result)) {
          result.disconnect()
        }
      })
    }
  }, [host])

  return value
}