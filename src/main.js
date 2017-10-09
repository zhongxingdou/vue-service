export default class VueServiceRegistry {
  constructor () {
    this._serviceMap = new Map()
  }

  reg (name, service) {
    this._serviceMap.set(name, service)
  }

  regVueBaseService (name, service) {
    this.reg(name, function (data) {
      return new service({propsData: data})
    })
  }

  get (name) {
    return this._serviceMap.get(name)
  }


  install (Vue, option = {}) {
    let self = this

    const isServiceOptionDefined = function (vueComp) {
      return vueComp && vueComp.$options.hasOwnProperty('service')
    }

    /**
    * @member {string|boolean} provide
    * @member {object} propData
    */
    const ServiceDefaultOption = {
       provide: false,
       propData: {}
    }

    /**
    * @param {Vue} vueComp
    * @param {Object} vueComp.$options
    * @param {[ServiceOption]} vueComp.$options.service
    */
    const getServices = function (vueComp) {
      if (!isServiceOptionDefined(vueComp)) return []

      let serviceMap = vueComp.$options.service

      return Reflect.ownKeys(serviceMap).map(serviceName => {
        const serviceOption = serviceMap[serviceName]
        const attachName = serviceOption.alias || serviceName

        return {
          serviceName,
          serviceOption,
          attachName
        }
      })
    }


    const createServiceInstance = function (Service, initData) {
      return new Service(initData)
    }

    const watchService = function (vueComp, service, option) {
      if (option) {
        for(let path in option) {
          if (service.$watch) {
            service.$watch(path, (...args) => {
              option[path].call(vueComp, ...args)
            })
          }
        }
      }
    }

    const attachServiceToComp = function (vueComp, service, attachName) {
      Reflect.defineProperty(vueComp, attachName, {
        get () {
          return service
        }
      })
    }

    const beforeCreate = function beforeCreate() {
      getServices(this).forEach(({serviceName, serviceOption, attachName}) => {
        serviceOption = Object.assign({}, ServiceDefaultOption, serviceOption)

        let service = self.get(serviceName)

        if (!service) {
          console.error('service ' + serviceOption.serviceName + ' not found')
          return
        }

        const serviceType = typeof service
        if (serviceType === 'function') {
          service = createServiceInstance(service, service.propsData)
        }

        watchService(this, service, serviceOption.watch)

        attachServiceToComp(this, service, attachName)

        console.log('attach service: ' + attachName)
      })
    }

    const isNeedProvide  = function (provide) {
      return provide === true || (typeof(provide) === 'string' && provide !== '')
    }

    const provide  = function provide() {
      return getServices(this).reduce((provideService, {serviceOption, attachName}) => {
        let serviceName = serviceOption.provide

        if (isNeedProvide(serviceName)) {
          serviceName = typeof(serviceName) === 'string' ?  serviceName : attachName
          provideService[serviceName] = this[attachName]

          console.log('provide service: ' + serviceName)
        }

        return provideService
      }, {})
    }

    Vue.mixin({
      beforeCreate,
      provide
    })
  }
}
