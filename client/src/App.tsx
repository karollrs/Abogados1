import { Switch, Route, Redirect } from "wouter";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";

import CallLogs from "@/pages/Calllogs";
import Attorneys from "@/pages/Attorneys";
import AttorneyCall from "@/pages/AttorneyCall";

import Users from "@/pages/Users";

import { ProtectedRoute } from "@/components/ProtectedRoute";

import Leads from "@/pages/Leads";

import NewManualLead from "@/pages/NewManualLead";

import ManualLeadForm from "@/pages/ManualLeadForm";





export default function App() {
  return (

    <Switch>
      {/* Público */}
      <Route path="/login" component={Login} />

      {/* Privado */}
      <ProtectedRoute
        path="/"
        component={Dashboard}
        allowedRoles={["admin", "agent", "abogado"]}
      />



      <ProtectedRoute
        path="/calls"
        component={CallLogs}
        allowedRoles={["admin", "agent"]}
      />

      <ProtectedRoute
        path="/leads/new-manual/:practiceArea"
        component={ManualLeadForm}
        allowedRoles={["admin", "agent"]}
      />

      <ProtectedRoute
        path="/leads/new-manual"
        component={NewManualLead}
        allowedRoles={["admin", "agent"]}
      />

      <ProtectedRoute
        path="/attorney-call"
        component={AttorneyCall}
        allowedRoles={["admin", "abogado"]}
      />



      <ProtectedRoute
        path="/attorneys"
        component={Attorneys}
        allowedRoles={["admin", "agent"]}
      />

      <ProtectedRoute path="/users" component={Users} allowedRoles={["admin"]} />

      <ProtectedRoute
        path="/leads"
        component={Leads}
        allowedRoles={["admin", "agent"]}
      />


      {/* Fallback */}
      <Route component={() => <Redirect to="/login" />} />
    </Switch>

  );
}
