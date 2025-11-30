import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard'; 
import { roleGuard } from './guards/role-guard';
import { DashboardRedirectComponent } from './main/dashboard-redirect/dashboard-redirect';

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
import { IndexComponent as ListadoAdeudosIndexComponent } from './listadoAdeudos/index/index';
import { CreateComponent as ListadoAdeudosCreateComponent } from './listadoAdeudos/create/create';
import { EditComponent as ListadoAdeudosEditComponent } from './listadoAdeudos/edit/edit';
import { ShowComponent as ListadoAdeudosShowComponent } from './listadoAdeudos/show/show'; 

//  Componentes de reglamentos

//import { IndexComponent as ReglamentosIndexComponent } from './reglamentos/index/index';
import { CreateComponent as ReglamentosCreateComponent } from './reglamentos/create/create';
import { ReglamentosEditComponent } from './reglamentos/edit/edit';
import { ReglamentosShowComponent } from './reglamentos/show/show';

// Componentes de reporteFinanzas
import { IndexComponent as ReporteFinanzasIndexComponent } from './reporteFinanzas/index/index';
import { CreateComponent as ReporteFinanzasCreateComponent } from './reporteFinanzas/create/create';
import { EditComponent as ReporteFinanzasEditComponent } from './reporteFinanzas/edit/edit';
import { ShowComponent as ReporteFinanzasShowComponent } from './reporteFinanzas/show/show';

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

  // Redirección inicial (Opcional: podrías mandarlo al login si está vacío)
  { path: '', redirectTo: 'login/index', pathMatch: 'full' },
  
  {
    path: 'main', 
    component: MainComponent, 
    canActivate: [authGuard], 
    children: [
      
      // -----------------------------------------------------------
      // 1. DASHBOARDS (Las rutas a las que redirige el Login)
      // -----------------------------------------------------------
      
      // Dashboard ADMIN: Ve finanzas por defecto
      { 
        path: 'dashboard-admin', 
        component: UsuariosIndexComponent, 
        canActivate: [roleGuard],
        data: { roles: ['administrador'] } 
      },

      // Dashboard GUARDIA: Ve bitácoras por defecto
      { 
        path: 'panel-guardia', 
        component: BitacorasIndexComponent, 
        canActivate: [roleGuard],
        data: { roles: ['guardia', 'administrador'] } 
      },

      // Dashboard RESIDENTE: Ve amenidades o avisos por defecto
      { 
        path: 'home-residente', 
        component: AmenidadesIndexComponent, 
        canActivate: [roleGuard],
        data: { roles: ['dueño', 'administrador'] } 
      },


      // -----------------------------------------------------------
      // 2. MÓDULOS SENSIBLES (SOLO ADMINISTRADOR)
      // -----------------------------------------------------------
      
      // USUARIOS: Solo el admin puede gestionar gente
      { 
         path: 'usuarios', 
         canActivate: [roleGuard],
         data: { roles: ['administrador'] }, // <--- CANDADO
         children: [
            { path: '', component: UsuariosIndexComponent },
            { path: 'create', component: UsuariosCreateComponent },
            { path: ':id/edit', component: UsuariosEditComponent },
            { path: ':id', component: ShowUsuarioComponent }
         ]
      },

      // FINANZAS: Solo el admin ve el dinero
      { 
         path: 'reporteFinanzas',
         canActivate: [roleGuard],
         data: { roles: ['administrador', 'dueño'] }, // <--- CANDADO
         children: [
            { path: '', component: ReporteFinanzasIndexComponent },
            { path: 'create', component: ReporteFinanzasCreateComponent },
            { path: ':id/edit', component: ReporteFinanzasEditComponent },
            { path: ':id', component: ReporteFinanzasShowComponent }
         ]
      },

      // LISTADO ADEUDOS (Gestión global)
      {
         path: 'listadoAdeudos',
         canActivate: [roleGuard],
         data: { roles: ['administrador'] }, // Admin gestiona, Residente ve el suyo en 'mi-perfil' o ruta aparte
         component: ListadoAdeudosIndexComponent
         // ... agrega tus hijos create/edit aquí si es necesario
      },


      // -----------------------------------------------------------
      // 3. MÓDULOS DE SEGURIDAD (ADMIN + GUARDIA)
      // -----------------------------------------------------------
      
      // BITÁCORAS: El guardia registra entradas/salidas
      { 
         path: 'bitacoras',
         canActivate: [roleGuard],
         data: { roles: ['administrador', 'guardia'] }, // <--- CANDADO COMPARTIDO
         children: [
            { path: '', component: BitacorasIndexComponent },
            { path: 'create', component: BitacorasCreateComponent },
            { path: ':id/edit', component: BitacorasEditComponent },
            { path: ':id', component: BitacorasShowComponent }
         ]
      },


      // -----------------------------------------------------------
      // 4. MÓDULOS SOCIALES (ADMIN + RESIDENTE)
      // -----------------------------------------------------------

      // AMENIDADES: Residentes reservan
      { 
         path: 'amenidades',
         canActivate: [roleGuard],
         data: { roles: ['administrador', 'dueño'] },
         children: [
            { path: '', component: AmenidadesIndexComponent },
            { path: 'create', component: AmenidadesCreateComponent }, // Quizás solo admin crea
            { path: 'reservar/:id', component: CreateComponent }, 
            { path: 'edit/:id', component: AmenidadesEditComponent }, 
            { path: 'show/:id', component: AmenidadesShowComponent }
         ]
      },

      // INVITAR AMIGOS
      {
         path: 'invitarAmigos',
         canActivate: [roleGuard],
         data: { roles: ['administrador', 'dueño'] },
         children: [
            { path: '', component: InvitarAmigosIndexComponent },
            { path: 'create', component: InvitarAmigosCreateComponent },
            { path: ':id/edit', component: InvitarAmigosEditComponent },
            { path: ':id', component: InvitarAmigosShowComponent }
         ]
         // ... hijos
      },

      // RESERVACIONES
      {
         path: 'reservaciones',
         canActivate: [roleGuard],
         data: { roles: ['administrador', 'dueño'] },
         children: [
             { path: '', component: ReservacionesIndexComponent }, 
             { path: 'create', component: CreateComponent }, // Ojo con la importación de CreateComponent aquí
             { path: 'edit/:id', component: ReservacionesEditComponent }, 
             { path: 'show/:id', component: ReservacionesShowComponent },
         ]
      },


      // -----------------------------------------------------------
      // 5. MÓDULOS GENERALES (TODOS)
      // -----------------------------------------------------------

      // INCIDENTES: Todos pueden reportar algo roto
      { 
         path: 'incidentes',
         canActivate: [roleGuard],
         data: { roles: ['administrador', 'guardia', 'dueño'] },
         children: [
            { path: '', component: IncidentesIndexComponent },
            { path: 'create', component: IncidentesCreateComponent },
            { path: ':id/edit', component: IncidentesEditComponent },
            { path: ':id', component: IncidentesShowComponent }
         ]
      },

      // REGLAMENTOS: Todos deben poder leerlos
      { 
         path: 'reglamentos',
         canActivate: [roleGuard],
         data: { roles: ['administrador', 'guardia', 'dueño'] },
         children: [
             { path: '', redirectTo: 'show/6910f476625ce8db61ec8f57', pathMatch: 'full' }, // Ajusté ruta
             { path: 'create', component: ReglamentosCreateComponent }, // Idealmente restringir create a Admin
             { path: ':id/edit', component: ReglamentosEditComponent }, 
             { path: ':id', component: ReglamentosShowComponent }
         ]
      },
      
      // Ruta por defecto interna (si alguien pone solo /main)
      {path: '', component: DashboardRedirectComponent, pathMatch: 'full' }
    ] 
  },

  // Manejo del 404 global
  { path: '**', redirectTo: 'login/index', pathMatch: 'full' }
];