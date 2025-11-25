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
import { ShowComponent as BitacorasShowComponent } from './bitacoras/show/show';

//  Componentes de incidentes 
import { IndexComponent as IncidentesIndexComponent } from './incidentes/index/index';
import { CreateComponent as IncidentesCreateComponent } from './incidentes/create/create';
import { EditComponent as IncidentesEditComponent } from './incidentes/edit/edit';
import { ShowComponent as IncidentesShowComponent } from './incidentes/show/show';

//  Componentes de invitarAmigos 
import { IndexComponent as InvitarAmigosIndexComponent } from './invitarAmigos/index/index';
import { CreateComponent as InvitarAmigosCreateComponent } from './invitarAmigos/create/create';
import { EditComponent as InvitarAmigosEditComponent } from './invitarAmigos/edit/edit';
import { ShowComponent as InvitarAmigosShowComponent } from './invitarAmigos/show/show';

//  Componentes de listadoAdeudos 
import { IndexComponent as ListadoAdeudosIndexComponent } from './listadoAdeudos/index/index';
import { CreateComponent as ListadoAdeudosCreateComponent } from './listadoAdeudos/create/create';
import { EditComponent as ListadoAdeudosEditComponent } from './listadoAdeudos/edit/edit';
import { ShowComponent as ListadoAdeudosShowComponent } from './listadoAdeudos/show/show'; 

//  Componentes de reglamentos

import { IndexComponent as ReglamentosIndexComponent } from './reglamentos/index/index';
import { CreateComponent as ReglamentosCreateComponent } from './reglamentos/create/create';
import { EditComponent as ReglamentosEditComponent } from './reglamentos/edit/edit';
import { ShowComponent as ReglamentosShowComponent } from './reglamentos/show/show';

// Componentes de reporteFinanzas
import { IndexComponent as ReporteFinanzasIndexComponent } from './reporteFinanzas/index/index';
import { CreateComponent as ReporteFinanzasCreateComponent } from './reporteFinanzas/create/create';
import { EditComponent as ReporteFinanzasEditComponent } from './reporteFinanzas/edit/edit';
import { ShowComponent as ReporteFinanzasShowComponent } from './reporteFinanzas/show/show';

//  Componentes de reservaciones
import { IndexComponent as ReservacionesIndexComponent } from './reservaciones/index/index';
import { CreateComponent as ReservacionesCreateComponent } from './reservaciones/create/create';
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
        { path: 'amenidades', component: AmenidadesIndexComponent }, 
        { path: 'amenidades/create', component: AmenidadesCreateComponent }, 
        { path: 'amenidades/:id/edit', component: AmenidadesEditComponent }, 
        { path: 'amenidades/:id', component: AmenidadesShowComponent }, 

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
        { path: 'reglamentos', component: ReglamentosIndexComponent }, 
        { path: 'reglamentos/create', component: ReglamentosCreateComponent }, 
        { path: 'reglamentos/:id/edit', component: ReglamentosEditComponent }, 
        { path: 'reglamentos/:id', component: ReglamentosShowComponent }, 

      // reporteFinanzas
        { path: 'reporteFinanzas', component: ReporteFinanzasIndexComponent }, 
        { path: 'reporteFinanzas/create', component: ReporteFinanzasCreateComponent }, 
        { path: 'reporteFinanzas/:id/edit', component: ReporteFinanzasEditComponent }, 
        { path: 'reporteFinanzas/:id', component: ReporteFinanzasShowComponent }, 

      // reservaciones
        { path: 'reservaciones', component: ReservacionesIndexComponent }, 
        { path: 'reservaciones/create', component: ReservacionesCreateComponent }, 
        { path: 'reservaciones/:id/edit', component: ReservacionesEditComponent }, 
        { path: 'reservaciones/:id', component: ReservacionesShowComponent }, 

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