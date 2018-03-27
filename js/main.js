var module = angular.module("workflowApp", [  "G5Service",  "ODataServiceUtil",  "ui.select",  "ngSanitize"]);
module.controller("workflowCtrl", function($scope,$http,$q,G5Service,ODataServiceUtil) {   
  $scope.formErrorMessage = "";
  $scope.entityName = "cargo";
  $scope.user = ""; //para as autenticações nas chamadas de serviços

  // objeto de gravação (exige um formulário no ECM com esses campos)
  $scope.entity = {
    numemp : 1,
    tipcol : 1,
    numcad : 0,
    cargo : "",
    datalt2: "",
    motivo: "",
    aprovador : "",
    validacao :""
  };

   //Combo com a relação de Empresas
   $scope.listaEmpresas = [{numemp: 1,nomemp:'Demonstra S.A'},
                           {numemp: 2,nomemp:'Comércio'},
                           {numemp: 3,nomemp:'Universidade'}];
   $scope.empresaSelecionada = {};

   //Combo com tipo de Colaborador
  $scope.listaTipCol = [{tipcol: 1,nome: 'Empregado'},
                        {tipcol: 2,nome: 'Parceiro'},
                        {tipcol: 3,nome: 'Terceiro'}];
  $scope.tipColSelecionado = {};

  //Combo com a relação de colaboradores
  $scope.listaColaboradores = [];
  $scope.colaboradorSelecionado = {};

  //Inicialização da API do workflow
  workflowCockpit({
    init: _init,
    onSubmit: _saveData,
    onError: _rollback
  });

  function _init(data, info) {
    //obtendo o usuário logado
    info.getUserData().then(function(user) {
      $scope.user = user.subject;
    }).then(function() {
      //obtendo o token da plataforma na inicialização
      info.getPlatformData().then(function(plataformData) {
          
        //configurando as APIs
        var wsserviceurl = "http://prddesk17:8080";
        var apig5resturl = "https://prddesk17:8181/G5ServiceAPI/G5Rest";
        G5Service.config(wsserviceurl, apig5resturl, $scope.user, plataformData.token);
        ODataServiceUtil.config(plataformData.serviceUrl, plataformData.odataUrl, plataformData.token);

                
        //se não é uma nova solicitação, obtem o record do formulário ECM baseado na instancia do processo e nome do formulário
        if (!info.isRequestNew()) {
          return ODataServiceUtil.getData($scope.entityName, data.processInstanceId).then(function(result) {
            $scope.entity = result;
            return result;
          }, function(error){
            $scope.showError(error);
          });
        }
      })
    });
  }

  function _saveData(data, info) {
    $scope.valid();
    var isNew = info.isRequestNew();
    return ODataServiceUtil.saveData( $scope.entityName,  data.processInstanceId,  $scope.entity, isNew ).then(function(result) {      
      console.log("when saveData - step "+$scope.getStep());
      if($scope.getStep()=="aprovacao" && $scope.entity.validacao == "SIM"){
        /*$scope.atualizaEndereco("A");*/
        console.log("Sucesso!");
      }
      return result;
    },function(error){
      $scope.showError(error);
    });
  }

 function _rollback(data, info) {
     debugger;
  }


  $scope.atualizaFiltroColaborador = function(){
    var params = {
        numEmp:  $scope.entity.numemp,
        abrTipCol:  $scope.entity.tipcol,
        iniPer: "01/01/1901",
        fimPer: ""
      }
      console.log("Atualizou Parâmetros",  params);
      G5Service.callRubiService("com.senior.g5.rh.fp.colaboradoresAdmitidos","ColaboradoresAdmitidos",params ).then(
        function(result) {
          $scope.listaColaboradores = result.TMCSColaboradores;
          
          //se não é solicitação, seleciona o colaborador conforme o numcad da solicitação
          if($scope.getStep()!="solicitacao"){          
            jQuery.each($scope.listaColaboradores,function(i, item){
              if(item.numCad==$scope.entity.numcad){
                $scope.colaboradorSelecionado = item;
                return false;
              }
            });
          }
        },
        function(error) {
          alert(error);
        }
      );
  };


  //search combo colaborador
  $scope.filtroColaborador = function(term) {
    //filtros do serviço de pesquisa
    var params = {
      numEmp:  $scope.entity.numemp,
      abrTipCol:  $scope.entity.tipcol,
      iniPer: "01/01/1901",
      fimPer: ""
    };


    //se não é solicitação limita ao registro da solicitação
    if($scope.getStep()!="solicitacao"){
      params.abrNumCad = $scope.entity.numcad;
    }


    G5Service.callRubiService("com.senior.g5.rh.fp.colaboradoresAdmitidos","ColaboradoresAdmitidos",params ).then(
      function(result) {
        $scope.listaColaboradores = result.TMCSColaboradores;
        
        //se não é solicitação, seleciona o colaborador conforme o numcad da solicitação
        if($scope.getStep()!="solicitacao"){          
          jQuery.each($scope.listaColaboradores,function(i, item){
            if(item.numCad==$scope.entity.numcad){
              $scope.colaboradorSelecionado = item;
              return false;
            }
          });
        }
      },
      function(error) {
        alert(error);
      }
    );

  };

    //search combo empresa
    $scope.filtroEmpresa = function(term) {
        //filtros do serviço de pesquisa
        var params = {
       
        };
    
    
        
        G5Service.callRubiService("com.senior.g7.wf","getEmpresas",params ).then(
          function(result) {
            $scope.listaEmpresas= result.empresas;
            console.log(result.empresas);
          if($scope.getStep()!="solicitacao"){          
            jQuery.each($scope.listaEmpresas,function(i, item){
              if(item.numEmp==$scope.entity.numEmp){
                $scope.empresaSelecionada = item;
                return false;
              }
            });
          }
          },
          function(error) {
            alert(error);
            console.log("erro");
          }
        ); 

        
      };



  $scope.onSelectColaborador = function($col, $model){
    if($col){
      $scope.entity.numemp = $col.numEmp;
      $scope.entity.tipcol = $col.tipCol;
      $scope.entity.numcad = $col.numCad;
      /*$scope.atualizaEndereco("C");*/
      $scope.buscaChefia();
    } else {
      $scope.entity.numcad = 0;
    }
  }  

  $scope.onSelectEmpresa = function($emp, $model){
    if($emp){
      $scope.entity.numemp = $emp.numemp;
      $scope.colaboradorSelecionado = {};
      $scope.colaboradorSelecionado.nomFun = '';
      $scope.atualizaFiltroColaborador();
      
      
    } else {
      $scope.entity.numemp = 0;
    }
  }  


  $scope.valid = function(){
    var error = "";
    if($scope.entity.cargo == ""){      
      error = 'Campos Obrigatórios não preenchidos.';
    }
    if($scope.entity.aprovador == ""){      
      error = 'Não encontrado o gestor do colaborador';      
    }

    if(($scope.getStep() == "aprovacao") && ($scope.entity.validacao == "")){
        error = 'Necessário informar a ação!';
    }

    if(error != ""){
      $scope.showError(error)
      throw Error(error);           
    }
  }

  //busca ou grava o endereço do colaborador selecionado (conforme operação C-Consulta e A-Altera)
  $scope.atualizaEndereco = function(operacao) {
    var params = {
      operacao : operacao,
      numemp : $scope.entity.numemp,
      tipcol : $scope.entity.tipcol,
      numcad : $scope.entity.numcad,
      endereco : $scope.entity.endereco,
      rua : $scope.entity.rua
    }
    console.log("atualizaEndereco "+operacao);
    G5Service.callRubiService("com.senior.g7.sampleatualizacaocadastral","atualizaEndereco", params).then(
      function(result) {
        console.log("atualizaEndereco result"+operacao);
        if(operacao == "C"){
          $scope.entity.endereco = result.endereco;
          $scope.entity.rua = result.rua;
        }
      },
      function(error) {
        $scope.showError(error)
        throw Error(error);  
      }
    );
  }

  //busca o chefe do colaborador selecionado
  $scope.buscaChefia = function() {
    var params = {
      numEmp : $scope.entity.numemp,
      tipCol : $scope.entity.tipcol,
      numCad : $scope.entity.numcad,
      datChe : $scope.getNow()
    }
    G5Service.callRubiService("com.senior.g5.rh.fp.chefias","BuscaChefia", params).then(
      function(result) {
        $scope.atualizaAprovador(result.empChe, result.tipChe, result.cadChe);          
      },
      function(error) {
        alert(error);
      }
    );
  }

  //busca o e-mail do colaborador e seta como o aprovador
  $scope.atualizaAprovador = function(numemp,tipcol,numcad){
    var params = {
      numEmp : numemp,
      tipCol : tipcol,
      numCad : numcad
    }
    G5Service.callRubiService("com.senior.g5.rh.fp.consultarColaborador","ConsultarColaborador", params).then(
      function(result) {
        if(result.TMCSColaboradores){
          $scope.entity.aprovador = result.TMCSColaboradores.emaCom.split("@")[0];
        } else {
          alert("Não foi possível encontrar o login do aprovador. [Sem e-mail comercial]");
        }
      },
      function(error) {
        alert(error);
      }
    );    
  }

  $scope.showError = function(msg){
    $scope.formHasErrors = true;
    $scope.formErrorMessage = msg;    
    $scope.$apply();          
  }

  /*
  Considerando a url algo assim: 
  https://nbbnu005017:8181/sample-atualizacao-cadastral/#/solicitacao/
  https://nbbnu005017:8181/sample-atualizacao-cadastral/#/aprovacao/
  https://nbbnu005017:8181/sample-atualizacao-cadastral/#/revisao/
  ...
  */
  $scope.getStep = function(){
    return window.location.href.match(/#\/(.*?)\//)[1];
  }

  $scope.getNow = function(){
    var now = new Date();
    return now.getDate()+"/"+(now.getMonth()+1)+"/"+now.getFullYear();
  } 
  
  function getDate(){
    var now = new Date();
    return now.getDate()+"/"+(now.getMonth()+1)+"/"+now.getFullYear();
  }
});
