var G5Service = angular
  .module("G5Service", [])
  .service("G5Service", function( $http, $q) {    
    G5Service.server = "http://[server:8080]";
    G5Service.apiUrl = "https://[server:8181]/G5ServiceAPI/G5Rest";
    
    G5Service.user = null;
    G5Service.token = null;
    G5Service.separator = "_"; 

    /**
     * Configura os parametros da API
     * @param {*} wsserviceurl endereço o servidor dos webservices G5 Exemplo "http://server:8080"
     * @param {*} apiUrl endereço da API G5ServiceAPI Exemplo "https://server:8181/G5ServiceAPI/G5Rest"
     * @param {*} user login g5
     * @param {*} token token
     * @param {*} separator [opcional] default "_". Alguns casos o separador é a "/". Checar na WSDL [g5-senior-services/rubi_Synccom | g5-senior-services/rubi/Synccom]
     */
    function _config(wsserviceurl, apiUrl, user, token, separator){
      G5Service.server = wsserviceurl;
      G5Service.apiUrl = apiUrl;            
      G5Service.user = user;
      G5Service.token = token.access_token;
      if(separator && separator != ""){
        G5Service.separator = separator;
      }
    }
    
    function _callService(module, service, port, serviceParameters, user, token) {
      var apiParameters = {
        //parametros obrigatórios
        server: G5Service.server,
        module: module,
        service: service,
        port: port,
        separator: G5Service.separator,
        //parametros do serviço
        ...serviceParameters
      };
      var _user = user;
      var _token = token;
      if(_user == null)     {
        _user = G5Service.user;
      }
      if(_token == null)     {
        _token = G5Service.token;
      }
      
      var err = _getConfigError(_user, _token);
      if(err){
        return err;
      }
      
      return $http({
        method: "POST",
        url: G5Service.apiUrl,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          user: _user,
          pass: _token,
          encryptionType: "3"
        },
        data: $.param(apiParameters)
      }).then(function(response) {        
        return $q(function(resolve, reject) {            
          var noHasError = (typeof response.data["S:Fault"] != "object" && typeof response.data.erroExecucao != "string");            
          if (noHasError) {
            resolve(response.data);
          } else {
            var resp = response.data?response.data.erroExecucao:response.data["S:Fault"].faultstring;
            reject(resp);
          }
        });
      },function(error){              
        throw `${error.status} ${error.statusText}`;
      });
    }    

    function _getConfigError(user, token){
      var err = null;
      if(user == null || user == ""){
        err = "Usuário não informado na chamada de webservices. Use G5Service.config(wsserviceurl, apig5resturl, user, token)";
      }else
      if(token == null || token == ""){
        err =  "Token não informado na chamada de webservices. Use G5Service.config(wsserviceurl, apig5resturl, user, token)";
      }else
      if(G5Service.server == null || G5Service.server == ""){
        err =  "wsserviceurl não informado na chamada de webservices. Use G5Service.config(wsserviceurl, apig5resturl, user, token)";
      }else
      if(G5Service.apiUrl == null || G5Service.apiUrl == ""){
        err =  "apig5resturl não informado na chamada de webservices. Use G5Service.config(wsserviceurl, apig5resturl, user, token)";
      }

      if(err){
        return $q(function(resolve, reject) {            
          reject(err);        
        });
      }
    }
    
    function _callBSService(service, port, serviceParameters, user, token) {           
      return _callService("bs", service, port, serviceParameters, user, token)
    }
    function _callHRService(service, port, serviceParameters, user, token) {           
      return _callService("hr", service, port, serviceParameters, user, token)
    }
    function _callQLService(service, port, serviceParameters, user, token) {           
      return _callService("ql", service, port, serviceParameters, user, token)
    }
    function _callSMService(service, port, serviceParameters, user, token) {           
      return _callService("sm", service, port, serviceParameters, user, token)
    }
    function _callRubiService(service, port, serviceParameters, user, token) {           
      return _callService("rubi", service, port, serviceParameters, user, token)
    }
    function _callTRService(service, port, serviceParameters, user, token) {           
      return _callService("tr", service, port, serviceParameters, user, token)
    }

    return {
      config: _config,
      callBSService: _callBSService,
      callHRService: _callHRService,
      callQLService: _callQLService,
      callSMService: _callSMService,
      callRubiService: _callRubiService,
      callTRService: _callTRService
    };
  });
