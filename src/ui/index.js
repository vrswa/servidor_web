SERVERIP = 'http://192.168.1.196:8888';
var Estilos= "cerulean chubby cosmo cyborg darkly flatly journal lumen paper readable sandstone simplex slate solar spacelab superhero united yeti"
              .split(' ');
var app_style= {};

function setTheme(t) {
  var st= document.getElementById("tema");
  st.href='/node_modules/semantic-ui-forest-themes/semantic.'+t+'.min.css';
}

//COMPONENTE DE LOGIN

uiIframe = MkUiComponent (function uiIframe(my){
  var url = my.props.url;
  iframeCFG={
    src:url,
    allowFullScreen: true,
    style: {
      padding: '10',
      height: '300px',
      width: '100%',
      border: 'none',
      overflow: 'hidden'
    },
  }
  my.render = function(){
    return (  
      h('iframe',iframeCFG,)
    )
  }
});

//formulario de ingresa 
uiLogin = MkUiComponent (function uiLogin(my){
  my.componentWillMount = function () {
    var body = document.getElementsByTagName('body')[0];
    body.style.backgroundImage = 'url(fondo.jpg)';
  }

  my.render = function(){
    return (
      h(Grid,{textAlign:'center', style:{ height: '100vh' }, verticalAlign:'middle'},
        h(Grid.Column, {style: {maxWidth: 450}}, 
          h(Header, {as:'h2', color:'teal', textAlign:'center',style: {'font-size':'25px'}},
            //<Image src='/logo.png' /> Log-in to your account
            h(Image,{src:'blk.png',style: {'height':'60px!important'}},),
            "Log-in to your account",
          ),
          h(Form,{size:'large'},
            h(Segment,{stacked:true},
              h(Form.Input,{fluid:true, icon:'user', iconPosition:'left', placeholder:'E-mail address'}),
              h(Form.Input,{ fluid:true, icon:'lock',iconPosition:'left',placeholder:'Password',type:'password'}),
              h(Button,{color:'blue', fluid:true,size:'large',onClick: () =>preactRouter.route("/menu")},"Login")
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
      h(Menu,{item:true,stackable:true},
        h(Menu.Item,{name: 'itemA',onClick: () => handleItemClick },"Consulta"),
        h(Menu.Item,{name: 'itemB',onClick: () => handleItemClick},"Reportes"),
        h(Dropdown, {name: 'itemC',onClick: () => handleItemClick,item:true, text:'Nuestro Menu'},
          h(Dropdown.Menu,{},
            h(Dropdown.Item,{},'item A'),
            h(Dropdown.Item,{},'item B'),
            h(Dropdown.Item,{},'item C')  
          )
        ),
        h(Menu.Menu,{position:'right'},
          h(Menu.Item,{},
            h(Label, {as:'a',color:'yellow' ,image: true},
              h('img',{'src':'https://react.semantic-ui.com/images/avatar/small/christian.jpg'}),
              'Bienvenido Tomas',
              h(Label.Detail,{},'Inspector Aduanero')
            )
          ),
          h(Menu.Item,{},
             h(Button, {negative:true,onClick: () =>preactRouter.route("/")},"salir" ),
            //h(Button, {negative:true,onClick: () => {console.log("hola")}},"salir" ),
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
    props.cambiarGuiaSeleccionada(value);
  }
  my.render= function (props, state) {
    return (
      h('div',{},
        h(Segment,{raised:true},
          h(Form,{},
            h(Form.Group,{}, 
              h(Form.Field, {inline: true},
                h(Label,{},'Guia de embarque'),
                h(Select,{ options:options, placeholder:'Guia', onChange : (e,{value}) => seleccion(e,{value}) }),
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
      my.state.GuiaDeEmbarque.inspeccion.map((k,index) => 
            h(Segment,{clearing:true},
              h('p',{style:{fontSize: '15px',}},
                h('b',{},'Contrato: '),
                my.state.GuiaDeEmbarque.Contrato , 
                h('b',{},' Evento: '),
                k.nombre,
                h('b',{},' lugar:'),
                k.lugar
              ),
              h('p',{style:{fontSize: '13px',}},
                h('b',{},'fecha Inicio: '),
                k.fechaInicio ? k.fechaInicio : '-', 
                h('b',{},' fecha Finalizacion: '),
                k.fechaFinalizacion ? k.fechaFinalizacion : '-',
              ),
              h(Button,{floated:'right',onClick: () => my.props.seleccionarEvento(k.nombre)},'Ver Items')
            )
          )
        :
        h('h1',{},'eliga una guia')
      )
    )
  }
});

//parte derecha muestra los items 
uiTabla= MkUiComponent(function uiTabla(my) { 
  //U: props.guia una guia de embarque , props.evento (confronta, confronta2, previa) 
  console.table(my.props)
  my.render= function (props, state) {
    return (
      h('div',{style:{'overflow': 'auto', 'overflow-y': 'hidden'}},
        h(Table,{celled: true, striped: true,unstackable: true,selectable: true},
          h(Table.Header,{},
            h(Table.Row,{},
              h(Table.HeaderCell,{colSpan:'4'},
              h(Icon,{name: 'file outline'}),
              `Evento: ${my.props.evento}`,  
              )
            )
          ),
          h(Table.Body,{},
            my.props.guia.Items.map( k => 
              h(Table.Row,{onClick: ()=> my.props.cambiarArchivo("video.mp4"),style:{cursor: 'pointer'}},
                h(Table.Cell,{collapsing: true},
                  k.itemName
                ),
                k.revisiones.map( revision =>              
                  revision.nombre == my.props.evento ?
                    Object.entries(revision).map( ([k,v]) =>
                      v != my.props.evento && k != "archivos" ? 
                        h(Table.Cell,{collapsing: true,textAlign:'right'}, `${k}: ${v}`) //A: el componente para esta ruta
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
  console.table(my.props)
  my.render= function (props, state) {  
    return (
      h(Grid,{ stackable: true,columns: 'two', divided: true, style: {'margin-top': '3%'}},
        h(Grid.Row,{},
          h(Grid.Column,{},
            h(uiGuiasDeEmbarque,{GuiaDeEmbarque: props.GuiaDeEmbarque, seleccionarEvento: my.props.seleccionarEvento})            
          ),
          h(Grid.Column,{},
            my.props.evento ?  
              h(uiTabla,{guia: my.props.GuiaDeEmbarque, evento: my.props.evento,cambiarArchivo: my.props.cambiarArchivo})
              : 
              h(Header,{},'Seleccione una guia')
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
    body.style.backgroundImage = 'url(fondo.jpg)';
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
  function cambiarGuiaSeleccionada (guiaId){
    var guiaSeleccionada = buscarGuia(guiaId);
    my.setState({guiaSeleccionada: guiaSeleccionada})
  }
  function cambiarArchivo (nombreArchivo){
    my.setState({
      ...my.state,
      archivo: nombreArchivo
    })
  }
  function seleccionarEvento(evento){
    console.log(evento)
    my.setState({evento: evento})
  }
  my.render= function (props, state) {
    return (
      h(Container, {},
        h(uiMenu,{}),
          my.state.manifiesto ? 
            h(uiSelects,{manifiesto: my.state.manifiesto.GuiasDeEmbarque, cambiarGuiaSeleccionada : cambiarGuiaSeleccionada},)
            :
            h('p',{},'')
          ,
          my.state.guiaSeleccionada?
          h(uiGridField,{GuiaDeEmbarque: my.state.guiaSeleccionada,cambiarArchivo: cambiarArchivo, seleccionarEvento: seleccionarEvento, evento: my.state.evento})
          :
          null,
          my.state.archivo ?
            h(uiIframe,{autoplay: false,url: `http://192.168.1.196:8888/api/blk/protocols/revisarNivelesLiquidos/${my.state.archivo}`})
          :
            null
      )
		);
  }
});



//-----------------------------------------------------------------------------

//RUTA DE PREACT ROUTE
Rutas= {
  "/":{cmp: uiLogin},
  "/menu": {cmp: uiClientPortal}
}
//-----------------------------------------------------------------------------
App= MkUiComponent(function App(my) {
 
  my.render= function (props, state) {
    return (
      h(Container, {id:'app'},
				h(preactRouter.Router, {history: History.createHashHistory()},
					Object.entries(Rutas).map( ([k,v]) => 
						h(v.cmp, {path: k, ...v}) //A: el componente para esta ruta
					)
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
