var ODataServiceUtil = angular
  .module("ODataServiceUtil", ["ODataResources"])
  .service("ODataServiceUtil", function($http, $q, $odataresource) {
    //ODataServiceUtil.odataurl = "https://platform.senior.com.br/t/senior.com.br/bridge/1.0/odata/";
    //ODataServiceUtil.odataurl = "https://pcbnu002050.interno.senior.com.br:8243/t/senior.com.br/bridge/1.0/odata/";    
    ODataServiceUtil.odataUrl = null;
    ODataServiceUtil.entityName = null;
    ODataServiceUtil.workflowServiceUrl = null;
    ODataServiceUtil.tokenG7 = null;
    ODataServiceUtil.recordId;

    function _config(workflowServiceUrl, odataUrl, tokenG7){
      ODataServiceUtil.workflowServiceUrl = workflowServiceUrl;      
      ODataServiceUtil.tokenG7 = tokenG7;
      if(odataUrl != undefined){
        ODataServiceUtil.odataUrl = odataUrl;
      }
      $http.defaults.headers.common.Authorization = `${tokenG7.token_type} ${tokenG7.access_token}`;
    }

    function _getData(entityName, processInstanceId) {
      var error = _getConfigError();
      if(error){
        return error;
      }
      
      ODataServiceUtil.entityName = entityName;
      const params = {
        processInstanceId: processInstanceId,
        entityName: ODataServiceUtil.entityName
      };
      
      
      return $http({
        method: 'POST',
        url: ODataServiceUtil.workflowServiceUrl + "platform/ecm_form/actions/getRecordIdByWorkflowProcessId",
        data: params,
        headers: {
            "Authorization": `${ODataServiceUtil.tokenG7.token_type} ${ODataServiceUtil.tokenG7.access_token}`
        }
      }).then(
        function(result) {
          var record = _createEntityODataResource(
            ODataServiceUtil.entityName
          );
          ODataServiceUtil.recordId = result.data.recordId
          return record.odata().get(ODataServiceUtil.recordId, function(result) {
              return result;
          }).$promise;
        },
        function(error) {
          throw `${error.status} ${error.statusText}`;
        }
      );
    }

    function _saveData(entityName, processInstanceId, entity, newRecord) {
      var error = _getConfigError();
      if(error){
        return error;
      }
        var Record = _createEntityODataResource(entityName);
        var entityData = {
          ...entity,
          processInstanceId: processInstanceId
        };
        if (newRecord == null || newRecord == true) {
          var record = new Record(entityData);        
          return record.$save().then(function() {
            return {
              formData: entity
            };
          });
        } else {
          entityData.id = ODataServiceUtil.recordId;
          var record = new Record(entityData);
          return record.$update().then(function() {
            return {
              formData: entity
            };
          });
        }
      }

    function _createEntityODataResource(entityName) {
      return $odataresource(
        ODataServiceUtil.odataUrl + "platform/ecm_form/:entity",
        {
          entity: entityName
        },
        {},
        {
          odatakey: "id"
        }
      );
    }

    function _getConfigError(){      
      var err = null;
      if(ODataServiceUtil.workflowServiceUrl == null || ODataServiceUtil.workflowServiceUrl == ""){
        return $q(function(resolve, reject) {            
          reject("ODataServiceUtil.workflowServiceUrl não definido. use ODataServiceUtil.config(workflowServiceUrl,tokenG7)");        
        });
      }
      if(ODataServiceUtil.tokenG7 == null || ODataServiceUtil.tokenG7 == ""){
        return $q(function(resolve, reject) {            
          reject("ODataServiceUtil.tokenG7 não definido. use ODataServiceUtil.config(workflowServiceUrl,tokenG7)");        
        });
      }
    }

    return {
      getData: _getData,
      saveData: _saveData,
      config: _config
    };
  });
