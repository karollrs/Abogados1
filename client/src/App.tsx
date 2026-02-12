import { Switch, Route, Redirect } from "wouter";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";

import CallLogs from "@/pages/Calllogs";
import Attorneys from "@/pages/Attorneys";

import Users from "@/pages/Users";

import { ProtectedRoute } from "@/components/ProtectedRoute";


export default function App() {
  return (
    
      <Switch>
        {/* Público */}
        <Route path="/login" component={Login} />

        {/* Privado */}
        <ProtectedRoute path="/" component={Dashboard} />
 
        <ProtectedRoute path="/calls" component={CallLogs} />
        <ProtectedRoute path="/attorneys" component={Attorneys} />

        <ProtectedRoute path="/users" component={Users} />

        {/* Fallback */}
        <Route component={() => <Redirect to="/login" />} />
      </Switch>
   
  );
}
