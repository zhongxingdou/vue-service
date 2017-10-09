var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var VueServiceRegistry = function () {
  function VueServiceRegistry() {
    _classCallCheck(this, VueServiceRegistry);

    this._serviceMap = new Map();
  }

  _createClass(VueServiceRegistry, [{
    key: 'reg',
    value: function reg(name, service) {
      this._serviceMap.set(name, service);
    }
  }, {
    key: 'regVueBaseService',
    value: function regVueBaseService(name, service) {
      this.reg(name, function (data) {
        return new service({ propsData: data });
      });
    }
  }, {
    key: 'get',
    value: function get(name) {
      return this._serviceMap.get(name);
    }
  }, {
    key: 'install',
    value: function install(Vue) {
      var option = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var self = this;

      var isServiceOptionDefined = function isServiceOptionDefined(vueComp) {
        return vueComp && vueComp.$options.hasOwnProperty('service');
      };

      /**
      * @member {string|boolean} provide
      * @member {object} propData
      */
      var ServiceDefaultOption = {
        provide: false,
        propData: {}

        /**
        * @param {Vue} vueComp
        * @param {Object} vueComp.$options
        * @param {[ServiceOption]} vueComp.$options.service
        */
      };var getServices = function getServices(vueComp) {
        if (!isServiceOptionDefined(vueComp)) return [];

        var serviceMap = vueComp.$options.service;

        return Reflect.ownKeys(serviceMap).map(function (serviceName) {
          var serviceOption = serviceMap[serviceName];
          var attachName = serviceOption.alias || serviceName;

          return {
            serviceName: serviceName,
            serviceOption: serviceOption,
            attachName: attachName
          };
        });
      };

      var createServiceInstance = function createServiceInstance(Service, initData) {
        return new Service(initData);
      };

      var watchService = function watchService(vueComp, service, option) {
        if (option) {
          var _loop = function _loop(path) {
            if (service.$watch) {
              service.$watch(path, function () {
                var _option$path;

                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                  args[_key] = arguments[_key];
                }

                (_option$path = option[path]).call.apply(_option$path, [vueComp].concat(args));
              });
            }
          };

          for (var path in option) {
            _loop(path);
          }
        }
      };

      var attachServiceToComp = function attachServiceToComp(vueComp, service, attachName) {
        Reflect.defineProperty(vueComp, attachName, {
          get: function get() {
            return service;
          }
        });
      };

      var beforeCreate = function beforeCreate() {
        var _this = this;

        getServices(this).forEach(function (_ref) {
          var serviceName = _ref.serviceName,
              serviceOption = _ref.serviceOption,
              attachName = _ref.attachName;

          serviceOption = Object.assign({}, ServiceDefaultOption, serviceOption);

          var service = self.get(serviceName);

          if (!service) {
            console.error('service ' + serviceOption.serviceName + ' not found');
            return;
          }

          var serviceType = typeof service === 'undefined' ? 'undefined' : _typeof(service);
          if (serviceType === 'function') {
            service = createServiceInstance(service, service.propsData);
          }

          watchService(_this, service, serviceOption.watch);

          attachServiceToComp(_this, service, attachName);

          console.log('attach service: ' + attachName);
        });
      };

      var isNeedProvide = function isNeedProvide(provide) {
        return provide === true || typeof provide === 'string' && provide !== '';
      };

      var provide = function provide() {
        var _this2 = this;

        return getServices(this).reduce(function (provideService, _ref2) {
          var serviceOption = _ref2.serviceOption,
              attachName = _ref2.attachName;

          var serviceName = serviceOption.provide;

          if (isNeedProvide(serviceName)) {
            serviceName = typeof serviceName === 'string' ? serviceName : attachName;
            provideService[serviceName] = _this2[attachName];

            console.log('provide service: ' + serviceName);
          }

          return provideService;
        }, {});
      };

      Vue.mixin({
        beforeCreate: beforeCreate,
        provide: provide
      });
    }
  }]);

  return VueServiceRegistry;
}();

export default VueServiceRegistry;
