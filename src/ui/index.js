SERVERIP = 'http://localhost:8888';
//new date(JSONDATA) = DATE OBJECT
CfgManifestUrl = 'api/blk/protocols/demo/missions/demoMission/ManifestExample1.json';
CfgFileUrl = 'api/blk/protocols/demo/missions/demoMission';
//colores rgb de la empresa BLK
rgbColors = {
  azulOscuro: 'rgb(56,87,162)',
  azulClaro: 'rgb(105,178,226)',
}
//INSPECTION NAMES
PALLETINSPECTION = "pallet inspection";
INSPECTION1 = "Inspection 1";
INSPECTION2 = "Inspection 2";
INSPECTION3 = "Inspection 3";

var Estilos= "cerulean chubby cosmo cyborg darkly flatly journal lumen paper readable sandstone simplex slate solar spacelab superhero united yeti"
              .split(' ');

function setTheme(t) {
  var st= document.getElementById("tema");
  st.href='/node_modules/semantic-ui-forest-themes/semantic.'+t+'.min.css';
}
              
//VARIABLES PARA COMUNICACION ENTRE componentes
var usuarioFormularioIngreso = '';
var listaArchivos = ''; //A: contiene la lista de archivos que quiero mostrar en el modal
var eventoGlobal;

//componente que muestra un modal y llama a uiGaleria
uiModal = MkUiComponent (function uiModal(my){
  //ESTILOS
  modal = {
    'position': 'fixed', /* Stay in place */
    'z-index': '1', /* Sit on top */
    'padding-top': '50px', /* Location of the box */
    'left': '0',
    'top': '0',
    'width': '100%', /* Full width */
    'height': '100%', /* Full height */
    'overflow': 'auto', /* Enable scroll if needed */
    'background-color': 'rgb(0,0,0)', /* Fallback color */
    'background-color': 'rgba(0,0,0,0.4)', /* Black w/ opacity */
  }
  /* Modal Content */
  modalContent = {
    'background-color':'#fefefe',
    'margin':' auto',
    'padding': '20px',
    'border': '1px solid #888',
    'width': '90%',
    'min-height': '25%'
  }
  ///////////////////
  function handleClick () {
    my.setState({visible: false})
  }
  my.state = {
    visible: true
  }
  
  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
    if (event.target.id == 'myModal') {
      my.setState({visible: false})
    }
  }

  my.render = function(){
    return (
      my.state.visible ? 
      h('div',{id:"myModal",class: 'modal',style:modal},
        h('div',{class: "modal-content",style:modalContent},
          h('div',{style:{}},
            h(Button,{icon: 'x', floated:'right',id: 'exit',onClick: handleClick}, ),
          ),
          h(Header,{as: 'h1'},
            h(Icon,{name: 'film'}),
            h(Header.Content,{},'Medias for this item')
          ),
          h(uiGallery,{})
        )
      )
      : null
    )
  }
});

//componente que muestra los archivos del array listaArchivos
uiGallery = MkUiComponent (function uiGallery(my){
  url = `${SERVERIP}/${CfgFileUrl}`;
  videoImagePlaceHolder = 'https://cdn.pixabay.com/photo/2015/12/03/01/27/play-1073616_960_720.png'


  function createLink(fileName){
    //http://192.168.1.196:8888/api/blk/protocols/revisarNivelesLiquidos/motor.jpg
    my.setState({url: `${SERVERIP}/${CfgFileUrl}/${fileName}`});
    minHeight = '25em';
  }

  my.render = function(){
    console.log(listaArchivos)
    return (
      h(Grid,{ stackable: true,divided: true,},
        h(Grid.Row,{},
          h(Grid.Column,{width: '4', style:{}},
            listaArchivos.map( fileName => (
              fileName.substring(fileName.length-3) == 'mp4'
              ?h(Image,{onClick:()=> createLink(fileName),rounded: true,size: 'tiny',centered: true, src: videoImagePlaceHolder,style:{'margin-top': '5%','cursor': 'pointer'}})
              :h(Image,{onClick:()=> createLink(fileName), rounded: true,size: 'small',centered: true, bordered: true, src: `${url}/${fileName}`,style:{'margin-top': '5%','cursor': 'pointer'}})             
              )
            )
          ),
          h(Grid.Column,{width: '12',style:{}},
            my.state.url
            ? my.state.url.search("mp4") != -1 
                ?h('iframe',{src: my.state.url,autoplay: false,style: {'min-height': minHeight,'min-width': '70%',border: 'none','display':'block',margin: '0 auto'}},)
                :h(Image,{centered: true, bordered: true, src: my.state.url})
            :null
          )
        )
      )
    )
  }
});

//formulario de ingreso 
uiLogin = MkUiComponent (function uiLogin(my){
  my.componentWillMount = function () {
    var body = document.getElementsByTagName('body')[0];
    body.style.backgroundColor = 'rgb(49, 84, 165)';
  }

  tecleando = (e, { name, value }) => my.setState({[name]: value});
  enviarFormulario = () => {
    usuarioFormularioIngreso = my.state.nombre;
    if(usuarioFormularioIngreso !='' && usuarioFormularioIngreso != null & usuarioFormularioIngreso != undefined){
      if(my.state.password !='' && my.state.password != null & my.state.password != undefined)
      preactRouter.route("/menu")
    }
  }

  my.render = function(){
    return (
      h(Grid,{textAlign:'center', style:{ height: '100vh' }, verticalAlign:'middle'},
        h(Grid.Column, {style: {maxWidth: 450}},
          h(Image,{src:'./imagenes/blk.png'},), 
          h(Form,{size:'large',onSubmit: enviarFormulario },
            h(Segment,{stacked:true},
              h(Form.Input,{name: 'nombre',onChange: tecleando , fluid:true, icon:'user', iconPosition:'left', placeholder:'E-mail address',value: my.state.nombre}),
              h(Form.Input,{name: 'password', onChange: tecleando,fluid:true, icon:'lock',iconPosition:'left',placeholder:'Password',type:'password',value: my.state.password}),
              h(Button,{color:'blue', fluid:true,size:'large'},"Login")  //onClick: () =>preactRouter.route("/menu")
            )
          )  
        )
      )
    )
  }
});

//menu principal de la parte superior 
uiMenu= MkUiComponent(function uiMenu(my) {
  handleItemClick = (e, { name }) => {my.setState({ activeItem: name });} 
  my.state= {
    activeItem: 'itemA'
  }

  my.render= function (props, state) {
    return (
      h(Menu,{item:true,stackable:true,style:{backgroundColor: 'rgb(255, 255, 255)'}},
      //width: 180px;height:60px
        h('img',{src: './imagenes/logoBlanco.png',style:{width:"180px",height:'60px',"margin-top":"3px"}}),
        h(Menu.Item,{},
          //h('img',{src: './imagenes/logoBlanco.png',width:'50px!important'})
        ),
        h(Menu.Menu,{position:'right'},
          h(Menu.Item,{},
            h(Icon,{name:'user',size:'big',style:{'color': rgbColors.azulOscuro}}),
            h('p',{style:{'color': rgbColors.azulOscuro}}, `Welcome ${usuarioFormularioIngreso ? usuarioFormularioIngreso : ''}`,)
            
          ),
          h(Menu.Item,{},
            //onClick="window.location.reload()
            //refresh
            h(Button, {onClick: () =>preactRouter.route("/"), style:{'background-color': rgbColors.azulClaro,'color':'rgb(255,255,255)'}},"Log Out" ),
            h(Button, {icon: true,labelPosition:'left',onClick: () =>window.location.reload(), color: 'green',style:{ 'margin-left': '15px'}},
              h(Icon,{name:'refresh'}),
              "Refresh" 
            )
          )
        ),
      )
		);
  }
});

//selects para elegir manifiesto y guia de embarque
uiSelects = MkUiComponent(function uiSelects(my,props) {
  const options = props.manifiesto.map( guia => 
      { return {
        key: guia.id,
        text:  guia.id,
        value:  guia.id
      }
    }
  )
  //se ejecuta cuando se seleccion un item del select
  function seleccion(e,{value}){
    my.setState({...my.state,value: value});
    props.cambiarGuiaSeleccionada(value,true);
  }
  my.render= function (props, state) {
    return (
      h('div',{},
        h(Segment,{raised:true,},
          h(Form,{},
            h(Form.Group,{}, 
              h(Form.Field, {inline: true},
                h(Label,{},`Manifest: ${props.minifiestoID}`),
                h(Select,{ options:options, placeholder:'Air Waybills', onChange : (e,{value}) => seleccion(e,{value}), value: my.state.value}),
              )
            )
          )
        ),
      )
		)
  }
});

//parte izquierda del grid muestra el estado de la guia
uiGuiasDeEmbarque= MkUiComponent(function uiGuiasDeEmbarque(my) {
  console.log("----PROPS-----")
  console.log(my.props.GuiaDeEmbarque)

  //A: muestro modal si el pallet esta daniado sino muestro tabla
  function mostrarModal (nombreEvento,archivos){
    if (nombreEvento == PALLETINSPECTION){
      listaArchivos = archivos;
      my.setState({mostrarModal: true})
    }else{
      my.props.seleccionarEvento(nombreEvento,true)
    }
  }

  function JSONtoDATE(JSONdate){
    let fecha = new Date(JSONdate);
    return  `${fecha.getDate()}/${fecha.getMonth()}/${fecha.getFullYear()}`;
  }

  function JSONtoHour(JSONdate){
    let date = new Date(JSONdate);
    return `${date.getHours()}:${date.getMinutes()}`;
  }
  my.render= function (props, state) {
    if (my.props.GuiaDeEmbarque ){
      my.state = {
        ...my.state,
        GuiaDeEmbarque: my.props.GuiaDeEmbarque
      }
      guia = my.state.GuiaDeEmbarque;
    }
    console.log("-----GUIA-----")
    console.log(guia)
  return (
    h('div', {id:'app'},
    my.state.mostrarModal ?
        h(uiModal,{},'sadsadsadasdsa')
        :
        null
      ,
    my.state.GuiaDeEmbarque ? 
      h('div',{},
      /*********************************************************/
      //  Pre inspection Card
      /****************************************************** */
      h(Segment,{clearing:true,style:{'max-height': '152px'}},
        h('p',{style:{fontSize: '15px'}},
          h('b',{style:{'font-size':'20px'}},'Event: To be Inspected'),
          h('div',{},
            h('b',{style:{'margin-top': '5px'}},' Origin Airport:'),
            guia.OriginAirport,
            h('b',{style:{'margin-top': '5px'}},' Destination Airport:'),
            guia.DestinationAirport
          )
        ), 
        h(Grid,{columns: 'two', style: {}},
          h(Grid.Row,{},
            h(Grid.Column,{},
              //primer columna  
            h('p',{style:{fontSize: '13px',}},

              h('div',{},h('b',{style:{color: rgbColors.azulOscuro}},'Items: '),
              guia.items.length), 
            ),
            ),
            h(Grid.Column,{},
              //otra columna
              h(Button,{floated:'right',onClick: () => my.props.seleccionarEvento('Pre Inspection',true)},h('b',{},'More info'))
            )
          )
        )
      ),
      /******************************************************* */
      //  END pre inspection Card
      /******************************************************* */

      my.state.GuiaDeEmbarque.inspeccion.map((k,index) => 
            k.nombre != PALLETINSPECTION || (k.nombre == PALLETINSPECTION && k.problem == true) ? 
            h(Segment,{clearing:true,style:{'max-height': '152px'}},
              h('p',{style:{fontSize: '15px'}},
                h('b',{style:{'font-size':'20px'}},'Event: ',k.nombre),
                h('div',{},
                  h('b',{style:{'margin-top': '5px'}},' Place:'),
                  k.lugar
                )
              ), 
              h(Grid,{columns: 'two', style: {}},
                h(Grid.Row,{},
                  h(Grid.Column,{},
                    //primer columna  
                  h('p',{style:{fontSize: '13px',}},

                    h('div',{},h('b',{style:{color: rgbColors.azulOscuro}},'Date: '),
                    k.fechaInicio ? JSONtoDATE(k.fechaInicio) : '-'), 

                    h('div',{},h('b',{style:{color: rgbColors.azulOscuro}},' Start time: '),
                    k.fechaInicio ? JSONtoHour(k.fechaInicio) : '-'),

                    h('div',{},h('b',{style:{color: rgbColors.azulOscuro}},' End time: '),
                    k.fechaFinalizacion ? JSONtoHour(k.fechaFinalizacion) : '-'),
                  ),
                  ),
                  h(Grid.Column,{},
                    //otra columna
                    h(Button,{floated:'right',onClick: () => mostrarModal(k.nombre,k.archivos)},h('b',{},'More info'))
                  )
                )
              )
            )
            : 
            null
          )
        )
        :
        h('h1',{},'Select a Air Waybill')
      )
    )
  }
});

//A: tabla que muestra el estado de los items
uiTabla= MkUiComponent(function uiTabla(my) { 
  //U: props.guia una guia de embarque , props.evento (confronta, confronta2, previa) 
  var columnas = 6;
  if(my.props.evento == INSPECTION3) columnas = 8;
  console.log(my.props.evento)
  function tableRowClick (k) {
    revision=k.revisiones; 
    for (let index = 0; index < revision.length; index++) {
      if (revision[index].nombre == my.props.evento){
        if (revision[index].archivos.length > 0){
          listaArchivos = revision[index].archivos; //A: guardo en la variable la lista de archivos que quiero mostrar
          my.setState({mostrarModal: true});        //A: y muestro el modal
        }
      }    
    }
  }
  my.render= function (props, state) {

    return (
      h('div',{style:{'overflow': 'auto', 'overflow-y': 'hidden'}},
        h(Table,{celled: true, striped: true,unstackable: true,selectable: true},
          h(Table.Header,{},
            h(Table.Row,{},
              h(Table.HeaderCell,{colSpan: columnas},
              h(Icon,{name: 'file outline'}),
              `Event: ${my.props.evento}`,  
              )
            ),
            h(Table.Row,{},
              h(Table.HeaderCell,{},`Item Name`),
              h(Table.HeaderCell,{},`Reported`),
              h(Table.HeaderCell,{},`Inspected`),
              h(Table.HeaderCell,{},`Damaged`),
              h(Table.HeaderCell,{},`Missing`),
              h(Table.HeaderCell,{},`excess`),
              my.props.evento == INSPECTION2 ? h(Table.HeaderCell,{},`Hall`):null,
              my.props.evento == INSPECTION2 ? h(Table.HeaderCell,{},`Shelf`):null,
              h(Table.HeaderCell,{},'Media')
            )
          ),
          h(Table.Body,{},
            my.props.guia.items.map( k => 
              k.revisiones.map( revision =>              
                revision.nombre == my.props.evento ?
                  ( 
                    h(Table.Row,{onClick: ()=> { tableRowClick (k)},style:{cursor: 'pointer'}},
                    h(Table.Cell,{collapsing: true},k.name),
                    h(Table.Cell,{collapsing: true,textAlign:'right'}, `${revision.packages ? revision.packages :'-'}`),
                    h(Table.Cell,{collapsing: true,textAlign:'right'}, `${revision.inspected ? revision.inspected : '-'}`),
                    h(Table.Cell,{collapsing: true,textAlign:'right'}, `${revision.damaged ? revision.damaged : '-'}`),
                    h(Table.Cell,{collapsing: true,textAlign:'right'}, `${revision.missing ? revision.missing : '-'}`),
                    h(Table.Cell,{collapsing: true,textAlign:'right'}, `${revision.inExcess ? revision.inExcess : '-'}`),
                    revision.pasillo ? h(Table.Cell,{collapsing: true,textAlign:'right'}, `${revision.pasillo}`) : null,
                    revision.estante ? h(Table.Cell,{collapsing: true,textAlign:'right'}, `${revision.estante}`) : null,

                    //reviso que exista el campo , y si existe que el array sea mayor que cero
                    revision.archivos ?
                      (
                        revision.archivos.length > 0 ?
                          h(Table.Cell,{collapsing: true,textAlign:'center'},
                            h(Icon,{color:'green', name:'checkmark', size:'large'})
                          )
                        :  h(Table.Cell,{collapsing: true,textAlign:'center'}, `-`)
                      ) 
                      : h(Table.Cell,{collapsing: true,textAlign:'center'}, `-`)
                    )//parentesis table row
                  )
                  : 
                  null  
              ),
              h(Table.Cell,{collapsing: true,textAlign:'right'},
                h(Icon,{name:'folder'}),
                'hola'
              )
            )  
          )
        ),
        //Modal para ver los archivos
        my.state.mostrarModal
        ? h(uiModal)
        : null   
      )           
		)
  }
});

//grid para dividir la pantalla en dos 
uiGridField = MkUiComponent(function uiClientPortal(my,props) {
  //GuiaDeEmbarque: my.state.guiaSeleccionada,cambiarArchivo: cambiarArchivo, seleccionarEvento: seleccionarEvento, evento: my.state.evento
  my.render= function (props, state) {  
    return (
      //h(Grid,{ stackable: true,columns: 'two', divided: true, style: {'margin-top': '3%'}},
      h(Grid,{ stackable: true,divided: true, style: {'margin-top': '3%'}},
        h(Grid.Row,{},
          h(Grid.Column,{width: '7'},
            h(uiGuiasDeEmbarque,{GuiaDeEmbarque: props.GuiaDeEmbarque, seleccionarEvento: my.props.seleccionarEvento})            
          ),
          h(Grid.Column,{width: '9'},
            my.props.evento ?  
              h(uiTabla,{guia: my.props.GuiaDeEmbarque, evento: my.props.evento,cambiarArchivo: my.props.cambiarArchivo})
              : 
              null
              //h(Header,{style:{color: 'rgb(255,255,255)'},textAlign:'center',size: 'huge'},'Select a Event')
          )
        )
      )
		)
  }
});

//llama a los demas componentes que muestran el portal de guias
uiClientPortal= MkUiComponent(function uiClientPortal(my) { 
  //U: funcion que obtiene los nombre de los dataset disponibles
  async function obtenerManifiesto (){   
    //var res1 = await fetch(`${SERVERIP}/api/blk/dataset/`)  //actualizar dataset de github
    var res = await fetch(`${SERVERIP}/${CfgManifestUrl}`);
    try {
      var json = await res.json();
      my.setState({manifiesto: json[0]}); 
    } catch (error) {
      my.setState({JsonError: true})
    }
    
  }

  //cambio el fondo
  my.componentWillMount = function () {
    var body = document.getElementsByTagName('body')[0];
    body.style.backgroundColor = 'rgb(49, 84, 165)';
  }

  //caundo se monta el componente cargo la informacion
  my.componentDidMount = async function () {
    await obtenerManifiesto();
  }

  //buscar una guia con su ID dentro de un manifiesto
  function buscarGuia( guiaId){
    listaGuias = my.state.manifiesto.guides;
    //tengo un array de json que tiene la informacion de las guias
    for (let index = 0; index < listaGuias.length; index++) {
        if( listaGuias[index].id == guiaId){
          console.log(listaGuias[index]) 
          return listaGuias[index]
        }
    }
  }
  
  //U: con el id , se cambia la guia en el state
  function cambiarGuiaSeleccionada (guiaId,limpiar){
    if(limpiar){
      my.setState({archivo: null, revisiones: null}),
      my.setState({evento: null})     
    }
    var guiaSeleccionada = buscarGuia(guiaId);
    my.setState({guiaSeleccionada: guiaSeleccionada})
  }

  function seleccionarEvento(evento, limpiar){
    eventoGlobal = evento; //el eventoGlobal me indica que archivos quiero ver, archivos de confronta1, confrota2 o previa
    if(limpiar){
      my.setState({archivo: null, revisiones: null})     
    }
    my.setState({evento: evento})
  }

  my.render= function (props, state) {
    return (
      h(Container, {},
        h(uiMenu,{}),
          my.state.JsonError ? 
          h(Segment,{},'JSON FORMAT ERROR, please fix the JSON and reload')
          :
          null
          ,
          my.state.manifiesto ? 
            h(uiSelects,{manifiesto: my.state.manifiesto.guides, cambiarGuiaSeleccionada : cambiarGuiaSeleccionada,minifiestoID: my.state.manifiesto.id},)
            :
            my.state.JsonError ?
              null
              : 
              h(Segment,{},'JSON FORMAT ERROR, please fix the JSON and reload')
          ,
          my.state.guiaSeleccionada ?
          h('div',{},
            h(Header,{as:'h2', image:'./imagenes/palet.png', content:`Air Waybill: ${my.state.guiaSeleccionada.id}`, style:{'color':'white','font-size':'23px','margin-top':'3%'}},),
            h(uiGridField,{GuiaDeEmbarque: my.state.guiaSeleccionada, seleccionarEvento: seleccionarEvento, evento: my.state.evento})
          )
          :
          null,
      )
		);
  }
});

//RUTA DE PREACT ROUTE
Rutas= {
  "/":{cmp: uiLogin},
  "/menu": {cmp: uiClientPortal},
}
//-----------------------------------------------------------------------------
App= MkUiComponent(function App(my) {
 
  my.render= function (props, state) {
    return (
      h(Container, {id:'app'},
				h(preactRouter.Router, {history: History.createHashHistory()},
					Object.entries(Rutas).map( ([k,v]) => 
						h(v.cmp, {path: k, ...v}) //A: el componente para esta ruta
          ),
				), //A: la parte de la app que controla el router
				//VER: https://github.com/preactjs/preact-router
			)
		);
  }
});
//-----------------------------------------------------------------------------

setTheme('chubby');
render(h(App), document.body);
//A: estemos en cordova o web, llama a la iniciali zacion
