

/***************************************************************************
 *                        VARIABLES GLOBALES
 **************************************************************************/
var MANIFIESTOS; //A:contiene toda la informacion que vino en el json
var MANIFIESTO_SELECCIONADO;

var listaGuiaDeEmbarque;
//INSPECTION NAMES
PALLETINSPECTION = "pallet inspection";
INSPECTION1 = "Inspection 1";
INSPECTION2 = "Inspection 2";
INSPECTION3 = "Inspection 3";
UNREGISTERED_ITEMS = "Unregistered items";
var usuarioFormularioIngreso = ''; //el nombre que se ingreso en el formulario de ingreso
var LISTA_ARCHIVOS = ''; //A: lista de archivos para mostrar en uiGallerry
var eventoGlobal;        //conserva el evento seleccionado

//colores rgb de la empresa BLK
rgbColors = {
  azulOscuro: 'rgb(56,87,162)',
  azulClaro: 'rgb(105,178,226)',
}

//server and files cfg
SERVERIP = 'http://localhost:8888';
CfgManifestUrl = 'api/blk/protocols/demo/missions/demoMission/ManifestExample1.json';
CfgFileUrl = 'api/blk/protocols/demo/missions/demoMission';

//selects placeholder
var manifiestoID;
var guiaID

/************************************************************************** */

var Estilos= "cerulean chubby cosmo cyborg darkly flatly journal lumen paper readable sandstone simplex slate solar spacelab superhero united yeti"
              .split(' ');

function setTheme(t) {
  var st= document.getElementById("tema");
  st.href='/node_modules/semantic-ui-forest-themes/semantic.'+t+'.min.css';
}
              

//componente que muestra un modal y llama a uiGaleria
uiModal = MkUiComponent (function uiModal(my){
  /*  ESTILOS */
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

  modalContent = {
    'background-color':'#fefefe',
    'margin':' auto',
    'padding': '20px',
    'border': '1px solid #888',
    'width': '90%',
    'min-height': '25%'
  }
  /******************* */
  function handleClick () {
    my.setState({visible: false})
  }
  my.state = { //quiero que se muestre visible apenas aparezca
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
          h(uiGallery,{}) //A: dentro del modal muestro uiGallery
        )
      )
      : null
    )
  }
});

//componente que muestra los archivos del array LISTA_ARCHIVOS
uiGallery = MkUiComponent (function uiGallery(my){
  url = `${SERVERIP}/${CfgFileUrl}`;
  videoImagePlaceHolder = 'https://cdn.pixabay.com/photo/2015/12/03/01/27/play-1073616_960_720.png'


  function createLink(fileName){
    //http://192.168.1.196:8888/api/blk/protocols/revisarNivelesLiquidos/motor.jpg
    my.setState({url: `${SERVERIP}/${CfgFileUrl}/${fileName}`});
    minHeight = '25em';
  }

  my.render = function(){
    return (
      h(Grid,{ stackable: true,divided: true,},
        h(Grid.Row,{},
          h(Grid.Column,{width: '4', style:{}},
            LISTA_ARCHIVOS.map( fileName => (
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


uiMenuTopbar= MkUiComponent(function uiMenuTopbar(my) {//U: menu principal de la parte superior 
  my.render= function (props, state) {
    return (
      h(Menu,{item:true,stackable:true,style:{backgroundColor: 'rgb(255, 255, 255)'}},
        h('img',{src: './imagenes/logoBlanco.png',style:{width:"180px",height:'60px',"margin-top":"3px"}}),
        
        h(Menu.Menu,{position:'right'},
          h(Menu.Item,{},
            h(Icon,{name:'user',size:'big',style:{'color': rgbColors.azulOscuro}}),
            h('p',{style:{'color': rgbColors.azulOscuro}}, `Welcome ${usuarioFormularioIngreso ? usuarioFormularioIngreso : ''}`,)
            
          ),
          h(Menu.Item,{},
            
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
 
  const options = MANIFIESTOS.map( manifiesto => 
    { return {
        key: manifiesto.id ? manifiesto.id : 'idNotFound',
        text:  manifiesto.id ? manifiesto.id : 'idNotFound',
        value:  manifiesto.id ? manifiesto.id : 'idNotFound'
      }
    }
  )

  //se ejecuta cuando se selecciona un item de los manifiestos
  function seleccionManifiesto(e,{value,text}){
    if (value =='idNotFound'){
      console.log({
        error: 'all guides have a field call "id" with unique value ',
        example: 'guide1 -> "id":"AWB-000001-0001"'
      })
    }
    for (let index = 0; index < MANIFIESTOS.length; index++) {
      if ( MANIFIESTOS[index].id == value){
        MANIFIESTO_SELECCIONADO = MANIFIESTOS[index];
        //CONSTRUYO LOS OPTION PARA EL SELECT PARA LAS GUIAS DE EMBARQUE
        listaGuiaDeEmbarque = MANIFIESTOS[index].guides.map ( guia =>{
          return{
          key: guia.id ? guia.id : 'idNotFound',
          text:  guia.id ? guia.id : 'idNotFound',
          value:  guia.id ? guia.id : 'idNotFound'
          }
        })
        manifiestoID = value; //global variable for select placeholder
        my.setState({manifiestoSeleccionado: true});
      }
    }
    //props.cambiarGuiaSeleccionada(value,true);
  }

  //se ejecuta cuando se seleccion un item del select
  function seleccion(e,{value}){
    if (value =='idNotFound'){
      console.log({
        error: 'all guides have a field call "id" with unique value ',
        example: 'guide1 -> "id":"AWB-000001-0001"'
      })
    }
    guiaID = value; //global variable for select placeholder
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
                h(Label,{},`Manifest:`),
                h(Select,{ options:options, placeholder: manifiestoID || 'manifest' , onChange : (e,{value}) => seleccionManifiesto(e,{value})}),
              ),
              listaGuiaDeEmbarque || my.props.guia ? 
                h(Form.Field, {inline: true},
                  h(Label,{},`Air waybill:`),
                  h(Select,{ options: listaGuiaDeEmbarque, placeholder: guiaID  || 'Air waybill', onChange : (e,{value}) => seleccion(e,{value})}),
                )
              :console.log("chau")
            )
          )
        ),
      )
		)
  }
});

//parte izquierda del grid muestra el estado de la guia
uiGuiasDeEmbarque= MkUiComponent(function uiGuiasDeEmbarque(my) {

  //A: muestro modal si el pallet esta daniado sino muestro tabla
  function mostrarModal (nombreEvento,archivos){
    console.log(nombreEvento)
    if (nombreEvento == PALLETINSPECTION || nombreEvento == UNREGISTERED_ITEMS){
      LISTA_ARCHIVOS = archivos;
      my.setState({mostrarModal: true})
    }else{
      my.props.seleccionarEvento(nombreEvento,true)
    }
  }

  //recibe una fecha en formato json y devuelve un string con la fecha dia/mes/anio
  function JSONtoDATE(JSONdate){
    
      let fecha = new Date(JSONdate);
      if (isNaN(fecha))
        return 'error en fecha'
      return  `${fecha.getDate()}/${fecha.getMonth()}/${fecha.getFullYear()}`;

  }

  function JSONtoHour(JSONdate){
    let date = new Date(JSONdate);
    return `${date.getHours()}:${date.getMinutes()}`;
  }

  //muestra mensaje por consola indicando el error y una solucion
  function mostrarh1(){
    console.log({
      error: 'all air way field muest have a inspeccion field, and must be an ARRAY',
      inspeccionExample: [{
                "nombre": "Inspection 1",
                "lugar": "CDMX Airport",
                "fechaInicio": "2012-04-23T18:25:43.511Z",
                "fechaFinalizacion" : "2012-04-23T18:27:56.123Z"
              },
              {
                "nombre": "Inspection 2",
                "estado": "completado/incompleto",
                "fechaInicio": "2012-04-23T18:25:43.511Z",
                "fechaFinalizacion" : "2012-04-23T18:27:56.123Z",
                "lugar": "CDMX Airport"  
              }]
    })
    return h('h1',{style: {color: 'white'}},'error, press f12 to more details');
  }
  my.render= function (props, state) {
    if (my.props.GuiaDeEmbarque ){
      my.state = {
        ...my.state,
        GuiaDeEmbarque: my.props.GuiaDeEmbarque
      }
      guia = my.state.GuiaDeEmbarque;
    }
  
  return (
    h('div', {id:'app'},
    my.state.mostrarModal ?
        h(uiModal,{},'sadsadsadasdsa')
        :
        null
      ,
    my.state.GuiaDeEmbarque && my.state.GuiaDeEmbarque.inspeccion && Array.isArray (my.state.GuiaDeEmbarque.inspeccion)? 
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
              h(Button,{
									floated:'right',
									onClick: () => {
										my.props.seleccionarEvento('Pre Inspection',true);
										console.log('CLICK More Info seleccionarEvento');
										setTimeout(() => {
											var el= document.getElementById("uiTablaDetalle")	
											el.scrollIntoView(); //A: movi para que se vea la tabla detalle
										}, 500);
									}
								},
								h('b',{},'More info')
							)
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
                    h(Button,
											{ floated:'right', 
												onClick: () => {
													mostrarModal(k.nombre,k.archivos)
													console.log('CLICK More Info motrarModal');
													setTimeout(() => {
														var el= document.getElementById("uiTablaDetalle")	
														el.scrollIntoView(); //A: movi para que se vea la tabla detalle
													}, 500);
												}
											},
											h('b',{},'More info'))
                  )
                )
              )
            )
            : 
            null
          )
        )
        :
        mostrarh1()
      )
    )
  }
});


uiTablaDetalle= MkUiComponent(function uiTablaDetalle(my) { //U: tabla que muestra el estado de los items
  //U: props.guia una guia de embarque , props.evento (confronta, confronta2, previa) 
  var columnas = 6;
  if(my.props.evento == INSPECTION3) columnas = 8;

  function tableRowClick (k) {
    revision=k.revisiones; //A: recibo todo el array de revisiones 
    for (let index = 0; index < revision.length; index++) {
      if ((revision[index].nombre == my.props.evento) && my.props.evento != "Pre Inspection"){  //pre inspection no puede tener archivos
        if (revision[index].archivos && revision[index].archivos.length > 0){
          LISTA_ARCHIVOS = revision[index].archivos; //A: guardo en la variable la lista de archivos que quiero mostrar
          my.setState({mostrarModal: true});        //A: y muestro el modal
        }
      }    
    }
  }
  my.render= function (props, state) {

    return (
      h('div',{id: 'uiTablaDetalle', style:{'overflow': 'auto', 'overflow-y': 'hidden'}},
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
                      //A: si existe el pasillo o estante lo muestro, sino existe y evento != inspection2 no muestro nada(no me genera columna) , sino muestro '-'
                      revision.pasillo ? h(Table.Cell,{collapsing: true,textAlign:'right'}, `${revision.pasillo}`) : (my.props.evento == INSPECTION2 ? h(Table.Cell,{collapsing: true,textAlign:'right'}, '-') : null),
                      revision.estante ? h(Table.Cell,{collapsing: true,textAlign:'right'}, `${revision.estante}`) : (my.props.evento == INSPECTION2 ? h(Table.Cell,{collapsing: true,textAlign:'right'}, '-') : null),

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


uiGridField = MkUiComponent(function uiClientPortal(my,props) { //U: grid para dividir la pantalla en dos: inspecciones y detalle 
  my.render= function (props, state) {  
    return (
      h(Grid,{ stackable: true,divided: true, style: {'margin-top': '3%'}},
        h(Grid.Row,{},
          h(Grid.Column,{width: '7'},
            h(uiGuiasDeEmbarque,{GuiaDeEmbarque: props.GuiaDeEmbarque, seleccionarEvento: my.props.seleccionarEvento})            
          ),
          h(Grid.Column,{width: '9'},
            my.props.evento ?  
              h(uiTablaDetalle,{guia: my.props.GuiaDeEmbarque, evento: my.props.evento,cambiarArchivo: my.props.cambiarArchivo})
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

  function seleccionarGuiaDeManifiesto(manifiesto,guia){
    for (let index = 0; index < manifiesto.length; index++) {
      if (manifiesto[index].id == guia) return manifiesto[index]
      
    }
    return -1;
  }

  //U: funcion que obtiene los nombre de los dataset disponibles
  async function obtenerManifiesto (){   
    //var res1 = await fetch(`${SERVERIP}/api/blk/dataset/`)  //actualizar dataset de github
    var res = await fetch(`${SERVERIP}/${CfgManifestUrl}`);
    if(res.status == 404){
      json = await res.json();
      console.log(json);
      my.setState({JsonError: true});
    }else{
      try {
        var json = await res.json();

        console.log(json)
        MANIFIESTOS = json;
        guiaSeleccionada = seleccionarGuiaDeManifiesto(json,"MAN-000001");
        my.setState({cargo : true})
        my.setState({manifiesto: guiaSeleccionada});
        //my.setState({manifiesto: json[0]});
      } catch (error) {
        console.log(error ={
          JSONError: true,
          error: error
        })
        my.setState({JsonError: true});
      }      
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
    listaGuias = MANIFIESTO_SELECCIONADO.guides;
    //tengo un array de json que tiene la informacion de las guias
    for (let index = 0; index < listaGuias.length; index++) {
        if( listaGuias[index].id == guiaId){
          return listaGuias[index]
        }
    }
  }
  

  function cambiarGuiaSeleccionada (guiaId,limpiar){  //U: con el id , se cambia la guia en el state

    if(limpiar){
      my.setState({archivo: null, revisiones: null}),
      my.setState({evento: null})     
    }
    var guiaSeleccionada = buscarGuia(guiaId);
    console.log(guiaSeleccionada)
    my.setState({guiaSeleccionada: guiaSeleccionada})
  }

  function seleccionarEvento(evento, limpiar){
    eventoGlobal = evento; //el eventoGlobal me indica que archivos quiero ver, archivos de confronta1, confrota2 o previa
    if(limpiar){
      my.setState({archivo: null, revisiones: null})     
    }
    my.setState({evento: evento})
  }

  my.render= function (props, state) { //U: aca se dibuja toda la pagina segun el estado
    return (
      h(Container, {},
        h(uiMenuTopbar,{}),

          my.state.JsonError ? 
          h(Segment,{},'ERROR, press f12 to see more details in console')
          :
          null
          ,

          my.state.cargo ? //A: si esta cargado el manifiesto muestro los select para que seleccion la guia
            h(uiSelects,{guia: my.state.guiaSeleccionada, cambiarGuiaSeleccionada : cambiarGuiaSeleccionada,minifiestoID: my.state.manifiesto.name},)
            :
            my.state.JsonError ?
              null
              : 
              h(Segment,{},'JSON FORMAT ERROR, please fix the JSON and reload')
          ,

          my.state.guiaSeleccionada ?
          h('div',{id: "guiaSeleccionada"}, //A: todo el detalle de la guia, cada inspeccion y si elijo una la tabla
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
