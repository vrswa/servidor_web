SERVERIP = 'http://192.168.1.203:8888';

rgbColors = {
  azulOscuro: 'rgb(56,87,162)',
  azulClaro: 'rgb(105,178,226)',
}
var Estilos= "cerulean chubby cosmo cyborg darkly flatly journal lumen paper readable sandstone simplex slate solar spacelab superhero united yeti"
              .split(' ');
var usuarioFormularioIngreso = '';
var listaArchivos = '';
var eventoGlobal;
function setTheme(t) {
  var st= document.getElementById("tema");
  st.href='/node_modules/semantic-ui-forest-themes/semantic.'+t+'.min.css';
}

//COMPONENTE DE LOGIN

//recibe la lista de archivos y el evento 
uiIframe = MkUiComponent (function uiIframe(my){
  console.log(my.props.revisiones, my.props.evento)
  var revisiones = my.props.revisiones;
  var evento = my.props.evento;
  var archivos;
  
  //se selecciona los archivos de la revision correspondiente
  for (let index = 0; index < revisiones.length; index++) {
    if(revisiones[index].nombre == evento){
      archivos = revisiones[index].archivos;
    }
  }

  function createLink(fileName){
    //http://192.168.1.196:8888/api/blk/protocols/revisarNivelesLiquidos/motor.jpg
    my.setState({url: `${SERVERIP}/api/blk/protocols/revisarNivelesLiquidos/${fileName}`});
  }

  my.render = function(){
    return (
      h('div',{style:{'margin-top': '3%', 'min-height': '20em'}},
        h(Button,{onClick: () => preactRouter.route("/menu"), floated:'right',style:{"background-color": "rgb(105, 178, 226)",color: "rgb(255, 255, 255)"}},'Return'),
        archivos == undefined
        ? h('p',{style:{'font-size':'20px',color: 'rgb(255,255,255)'}},'Go back and Select another Item')
        :h('div',{},
          h('h1',{style:{color: 'rgb(255,255,255)'}},'Media available'),
          archivos.map( fileName => h(Button,{onClick: () => createLink(fileName)}, fileName) )
        )
        ,
        my.state.url ?
        h('div',{style:{'margin-top': '3%'}},
          h('iframe',{src: my.state.url,allowFullScreen: true,autoplay: false,style: {padding: '10','min-height': '50em', width: '100%',border: 'none',overflow: 'hidden'}},)  
        ):
        null
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
          h(Image,{src:'blk.png'},), 
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
             h(Button, {onClick: () =>preactRouter.route("/"), style:{'background-color': rgbColors.azulClaro,'color':'rgb(255,255,255)'}},"Log Out" ),
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
        key: guia.nombre,
        text:  guia.nombre,
        value:  guia.nombre
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
        h(Segment,{raised:true},
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
  my.render= function (props, state) {
    if (props.GuiaDeEmbarque ){
      my.state = {
        ...my.state,
        GuiaDeEmbarque: my.props.GuiaDeEmbarque
      }
    }
  return (
    h('div', {id:'app'},
    my.state.GuiaDeEmbarque ? 
      h('div',{},
      //h(Header,{as:'h2', image:'./imagenes/palet.png', content:`Air Waybill: ${my.state.GuiaDeEmbarque.nombre}`, style:{'color':'white','font-size':'23px'}},),
      my.state.GuiaDeEmbarque.inspeccion.map((k,index) => 
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
                    k.fechaInicio ? k.fechaInicio : '-'), 

                    h('div',{},h('b',{style:{color: rgbColors.azulOscuro}},' Start time: '),
                    k.horaInicio ? k.horaInicio : '-'),

                    h('div',{},h('b',{style:{color: rgbColors.azulOscuro}},' End time: '),
                    k.horaFinalizacion ? k.horaFinalizacion : '-'),
                  ),
                  ),
                  h(Grid.Column,{},
                    //otra columna
                    h(Button,{floated:'right',onClick: () => my.props.seleccionarEvento(k.nombre,true)},h('b',{},'More info'))
                  )
                )
              )
            )
          )
        )
        :
        h('h1',{},'Select a Air Waybill')
      )
    )
  }
});

//parte derecha muestra los items 
uiTabla= MkUiComponent(function uiTabla(my) { 
  //U: props.guia una guia de embarque , props.evento (confronta, confronta2, previa) 
  var columnas = 5;
  if(my.props.evento == "previa") columnas = 7;
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
              my.props.evento == "confronta2" ? h(Table.HeaderCell,{},`Hall`):null,
              my.props.evento == "confronta2" ? h(Table.HeaderCell,{},`Shelf`):null
            )
          ),
          h(Table.Body,{},
            my.props.guia.Items.map( k => 
              //h(Table.Row,{onClick: ()=>  my.props.selecRevisiones(k.revisiones),style:{cursor: 'pointer'}},
              h(Table.Row,{onClick: ()=> { listaArchivos=k.revisiones; preactRouter.route("/files")},style:{cursor: 'pointer'}},
                h(Table.Cell,{collapsing: true},
                  k.itemName
                ),
                k.revisiones.map( revision =>              
                  revision.nombre == my.props.evento ?
                    Object.entries(revision).map( ([k,v]) =>
                      v != my.props.evento && k != "archivos" ? 
                        h(Table.Cell,{collapsing: true,textAlign:'right'}, `${v}`) //A: el componente para esta ruta
                      :
                      null
                    ) : 
                  null  
                )
              )
            )  
          )
        )
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
              h(uiTabla,{guia: my.props.GuiaDeEmbarque, evento: my.props.evento,cambiarArchivo: my.props.cambiarArchivo, selecRevisiones: my.props.selecRevisiones})
              : 
              null
              //h(Header,{style:{color: 'rgb(255,255,255)'},textAlign:'center',size: 'huge'},'Select a Event')
          )
        )
      )
		)
  }
});

//llama a los demas componente que muestran el portal de guias
uiClientPortal= MkUiComponent(function uiClientPortal(my) { 
  //U: funcion que obtiene los nombre de los dataset disponibles
  async function obtenerManifiesto (){     
    var res = await fetch(`${SERVERIP}/api/blk/dataset/ManifestExample1.json`);
    var json = await res.json();
    my.setState({manifiesto: json}); 
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
  //buscar una guia dentro de un manifiesto
  function buscarGuia( guiaId){
    listaGuias = my.state.manifiesto.GuiasDeEmbarque;
    //tengo un array de json que tiene la informacion de las guias
    for (let index = 0; index < listaGuias.length; index++) {
        if( listaGuias[index].nombre == guiaId){
          return listaGuias[index]
        }
    }
  }
  //funciona cambia la guia
  function cambiarGuiaSeleccionada (guiaId,limpiar){
    if(limpiar){
      my.setState({archivo: null, revisiones: null}),
      my.setState({evento: null})     
    }
    var guiaSeleccionada = buscarGuia(guiaId);
    my.setState({guiaSeleccionada: guiaSeleccionada})
  }
  function cambiarArchivo (nombreArchivo){
    my.setState({
      ...my.state,
      archivo: nombreArchivo
    })
  }
  function seleccionarEvento(evento, limpiar){
    eventoGlobal = evento;
    if(limpiar){
      my.setState({archivo: null, revisiones: null})     
    }
    my.setState({evento: evento})
  }

  function selecRevisiones(revisiones){
    my.setState({revisiones: revisiones})
  }

  
  my.render= function (props, state) {
    return (
      h(Container, {},
        h(uiMenu,{}),
          my.state.manifiesto ? 
            h(uiSelects,{manifiesto: my.state.manifiesto.GuiasDeEmbarque, cambiarGuiaSeleccionada : cambiarGuiaSeleccionada,minifiestoID: my.state.manifiesto.manifiestoId},)
            :
            h('p',{},'')
          ,
          my.state.guiaSeleccionada ?
          h('div',{},
            h(Header,{as:'h2', image:'./imagenes/palet.png', content:`Air Waybill: ${my.state.guiaSeleccionada.nombre}`, style:{'color':'white','font-size':'23px','margin-top':'3%'}},),
            h(uiGridField,{GuiaDeEmbarque: my.state.guiaSeleccionada,cambiarArchivo: cambiarArchivo, seleccionarEvento: seleccionarEvento, evento: my.state.evento,selecRevisiones: selecRevisiones})
          )
          :
          null,
          my.state.revisiones ?
          //preactRouter.route("/files",{info: "daniel"})
            h(uiIframe,{evento: my.state.evento, revisiones: my.state.revisiones})
          :
            null
      )
		);
  }
});

uiFiles = MkUiComponent( function uiFiles(my) {
 
  close = () => my.setState({ open: false });
  open = () => my.setState({ open: true })

  my.render = function(props,state){
    
    console.table(my.state)
    return(
        h('div', {id:'archivos',},
          // listaArchivos.length > 0 
          // ?
          // h('div',{},
          //   h(Button,{onClick: open},'abrir modal'),
          //   h(Modal,{open: my.state.open},
          //     h(Modal.Header,{},'Select a Photo'),
          //     h(Modal.Content,{},
          //       h('p',{},
          //         'Your inbox is getting full, would you like us to enable automatic',
          //         'archiving of old messages'
          //       )
          //     ),
          //     h(Modal.Actions,{},
          //       h(Button,{onClick: close()},'cerrar modal'),  
          //     )
          //   )
          // )
          // :h('h1',{style:{color: 'white'}},'No hay archivos')
          console.log(listaArchivos,eventoGlobal),
          h(uiIframe,{revisiones: listaArchivos, evento: eventoGlobal},)
        )   
    )}
});

//RUTA DE PREACT ROUTE
Rutas= {
  "/":{cmp: uiLogin},
  "/menu": {cmp: uiClientPortal},
  "/files":{cmp: (props) => h(uiFiles,{...props})}
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
