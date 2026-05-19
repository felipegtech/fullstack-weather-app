"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { register } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Cloud } from "lucide-react";

export function AuthForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({ username: "", email: "", password: "" });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await signIn("credentials", {
        redirect: false,
        username: loginData.username,
        password: loginData.password,
      });

      if (res?.error) {
        setError("Usuario o contraseña incorrectos");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado");
    } finally { setLoading(false); }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await register(registerData.username, registerData.email, registerData.password);
      
      const res = await signIn("credentials", {
        redirect: false,
        username: registerData.username,
        password: registerData.password,
      });

      if (res?.error) {
        setError("Registro exitoso, pero falló el inicio de sesión automático. Por favor, intenta entrar manualmente.");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Error al registrar usuario");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Cloud className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">WeatherAPI</p>
              <p className="text-xs text-muted-foreground">Tu pronóstico personal</p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="login" className="flex-1">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="register" className="flex-1">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Usuario</Label>
                  <Input placeholder="nombre_usuario" value={loginData.username}
                    onChange={e => setLoginData(p => ({ ...p, username: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Contraseña</Label>
                  <Input type="password" placeholder="••••••••" value={loginData.password}
                    onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))} required />
                </div>
                {error && <p className="text-destructive text-xs">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Iniciar sesión"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Correo electrónico</Label>
                  <Input type="email" placeholder="tu@correo.com" value={registerData.email}
                    onChange={e => setRegisterData(p => ({ ...p, email: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Usuario</Label>
                  <Input placeholder="nombre_usuario" value={registerData.username}
                    onChange={e => setRegisterData(p => ({ ...p, username: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Contraseña</Label>
                  <Input type="password" placeholder="••••••••" value={registerData.password}
                    onChange={e => setRegisterData(p => ({ ...p, password: e.target.value }))} required />
                </div>
                {error && <p className="text-destructive text-xs">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creando cuenta..." : "Crear cuenta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}