import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard'; 

//  Componentes de Layout y Login
import { IndexComponent as LoginComponent } from './login/index/index';
import { MainComponent } from './main/main/main';

//  Componentes de Amenidades 
import { AmenidadesIndexComponent } from './amenidades/index/index';
import { AmenidadesCreateComponent } from './amenidades/create/create';
import { AmenidadesEditComponent } from './amenidades/edit/edit';
import { AmenidadesShowComponent } from './amenidades/show/show';

//  Componentes de bitacoras 
import { IndexComponent as BitacorasIndexComponent } from './bitacoras/index/index';
import { CreateComponent as BitacorasCreateComponent } from './bitacoras/create/create';
import { EditComponent as BitacorasEditComponent } from './bitacoras/edit/edit';
import { BitacorasShowComponent } from './bitacoras/show/show';

//  Componentes de incidentes 
import { IncidentesIndexComponent } from './incidentes/index/index';
import { CreateComponent as IncidentesCreateComponent } from './incidentes/create/create';
import { EditComponent as IncidentesEditComponent } from './incidentes/edit/edit';
import { ShowComponent as IncidentesShowComponent } from './incidentes/show/show';

//  Componentes de invitarAmigos 
import { IndexComponent as InvitarAmigosIndexComponent } from './invitarAmigos/index/index';
import { CreateComponent as InvitarAmigosCreateComponent } from './invitarAmigos/create/create';
import { EditComponent as InvitarAmigosEditComponent } from './invitarAmigos/edit/edit';
import { ShowComponent as InvitarAmigosShowComponent } from './invitarAmigos/show/show';

//  Componentes de listadoAdeudos 
import { ListadoAdeudosIndexComponent } from './listadoAdeudos/index/index';
import { ListadoAdeudosCreateComponent } from './listadoAdeudos/create/create';
import { EditComponent as ListadoAdeudosEditComponent } from './listadoAdeudos/edit/edit';
import { ShowComponent as ListadoAdeudosShowComponent } from './listadoAdeudos/show/show'; 

//  Componentes de reglamentos

//import { IndexComponent as ReglamentosIndexComponent } from './reglamentos/index/index';
import { CreateComponent as ReglamentosCreateComponent } from './reglamentos/create/create';
import { ReglamentosEditComponent } from './reglamentos/edit/edit';
import { ReglamentosShowComponent } from './reglamentos/show/show';

// Componentes de reporteFinanzas
import { ReporteFinanzasIndexComponent } from './reporteFinanzas/index/index';
import { ReporteFinanzasCreateComponent } from './reporteFinanzas/create/create';
import { ReporteFinanzasEditComponent } from './reporteFinanzas/edit/edit';
import { ReporteFinanzasShowComponent } from './reporteFinanzas/show/show';

//  Componentes de reservaciones
import { IndexComponent as ReservacionesIndexComponent } from './reservaciones/index/index';
import { CreateComponent } from './reservaciones/create/create';
import { EditComponent as ReservacionesEditComponent } from './reservaciones/edit/edit';
import { ShowComponent as ReservacionesShowComponent } from './reservaciones/show/show';

//  Componentes de Usuarios 
import { UsuariosIndexComponent } from './usuarios/index/index';
import { UsuariosCreateComponent } from './usuarios/create/create';
import { UsuariosEditComponent } from './usuarios/edit/edit';
import { ShowUsuarioComponent } from './usuarios/show/show';


export const routes: Routes = [
  
  // RUTA PÚBLICA: LOGIN
  { path: 'login/index', component: LoginComponent },

  // Ruta por defecto: redirige a /main
  { path: '', redirectTo: 'main', pathMatch: 'full' },
  
  {
    path: 'main', 
    component: MainComponent, 
    canActivate: [authGuard], // Aplica la protección a todas las rutas hijas
    children: [
     
      { path: '', component: ReporteFinanzasIndexComponent },

      // Amenidades 
        { path: 'amenidades', children: [ // ⬅️ El prefijo es /main/amenidades
        { path: 'create', component: AmenidadesCreateComponent }, 
        { path: 'reservar/:id', component: CreateComponent }, 
        { path: 'edit/:id', component: AmenidadesEditComponent }, 
        { path: 'show/:id', component: AmenidadesShowComponent }, 
        { path: '', component: AmenidadesIndexComponent }, 
      ]},

      //  Bitacoras
        { path: 'bitacoras', component: BitacorasIndexComponent }, 
        { path: 'bitacoras/create', component: BitacorasCreateComponent }, 
        { path: 'bitacoras/:id/edit', component: BitacorasEditComponent }, 
        { path: 'bitacoras/:id', component: BitacorasShowComponent },         

      // Incidentes
        { path: 'incidentes', component: IncidentesIndexComponent }, 
        { path: 'incidentes/create', component: IncidentesCreateComponent }, 
        { path: 'incidentes/:id/edit', component: IncidentesEditComponent }, 
        { path: 'incidentes/:id', component: IncidentesShowComponent },

      // InvitarAmigos
        { path: 'invitarAmigos', component: InvitarAmigosIndexComponent }, 
        { path: 'invitarAmigos/create', component: InvitarAmigosCreateComponent }, 
        { path: 'invitarAmigos/:id/edit', component: InvitarAmigosEditComponent }, 
        { path: 'invitarAmigos/:id', component: InvitarAmigosShowComponent },       

      // ListadoAdeudos
        { path: 'listadoAdeudos', component: ListadoAdeudosIndexComponent }, 
        { path: 'listadoAdeudos/create', component: ListadoAdeudosCreateComponent }, 
        { path: 'listadoAdeudos/:id/edit', component: ListadoAdeudosEditComponent }, 
        { path: 'listadoAdeudos/:id', component: ListadoAdeudosShowComponent }, 

      // Reglamentos
        { 
            path: 'reglamentos', 
            redirectTo: 'reglamentos/6910f476625ce8db61ec8f57', // ID de ejemplo del reglamento activo
            pathMatch: 'full' 
        },
        { path: 'reglamentos/create', component: ReglamentosCreateComponent }, 
        { path: 'reglamentos/:id/edit', component: ReglamentosEditComponent }, 
        { path: 'reglamentos/:id', component: ReglamentosShowComponent }, 

        
      // reporteFinanzas
        { path: 'reporteFinanzas', children: [
            
            // RUTAS ESTÁTICAS PRIMERO
            { path: 'create', component: ReporteFinanzasCreateComponent }, 
            
            // RUTAS DINÁMICAS (SHOW y EDIT) - Usan el prefijo /reporteFinanzas/
            { path: 'edit/:id', component: ReporteFinanzasEditComponent }, 
            { path: 'show/:id', component: ReporteFinanzasShowComponent }, 
            
            // RUTA DE ÍNDICE (La ruta por defecto del módulo)
            { path: '', component: ReporteFinanzasIndexComponent }, 
        ]},

      // // reservaciones
      //   { path: 'reservaciones', component: ReservacionesIndexComponent }, 
      //   { path: 'reservaciones/create', component: CreateComponent }, 
      //   { path: 'reservaciones/:id/edit', component: ReservacionesEditComponent }, 
      //   { path: 'reservaciones/:id', component: ReservacionesShowComponent }, 

        // reservaciones
        { path: 'reservaciones', children: [
            { path: '', component: ReservacionesIndexComponent }, 
            { path: 'reservaciones/create', component: CreateComponent }, 
            { path: 'edit/:id', component: ReservacionesEditComponent }, 
            { path: 'show/:id', component: ReservacionesShowComponent },
        ]},
        
      // Usuarios
        { path: 'usuarios', component: UsuariosIndexComponent }, 
        { path: 'usuarios/create', component: UsuariosCreateComponent }, 
        { path: 'usuarios/:id/edit', component: UsuariosEditComponent }, 
        { path: 'usuarios/:id', component: ShowUsuarioComponent }, 
  

        // Manejo del 404 
        { path: '**', redirectTo: '/main', pathMatch: 'full' } // Redirige a la vista principal si no encuentra la ruta
    ] 
  }
];