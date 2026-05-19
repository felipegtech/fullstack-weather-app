"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWeather, getFavorites, addFavorite, deleteFavorite, Favorite, getWeatherHistory } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Cloud, Loader2, Thermometer, Droplets, MapPin, RefreshCw, Search, Heart, Trash2, History } from "lucide-react";

const normalizeCity = (city: string) => 
  city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchCity, setSearchCity] = useState("");
  const [currentCity, setCurrentCity] = useState(normalizeCity("Medellin"));

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  const { data: weather, isLoading, isError, refetch } = useQuery({
    queryKey: ["weather", currentCity],
    queryFn: () => getWeather(currentCity),
    enabled: !!session,
  });

  const { data: favorites = [] } = useQuery<Favorite[]>({
    queryKey: ["favorites"],
    queryFn: getFavorites,
    enabled: !!session,
  });

  const { data: history = [] } = useQuery({
    queryKey: ["history"],
    queryFn: getWeatherHistory,
    enabled: !!session,
  });

  const addFavoriteMutation = useMutation({
    mutationFn: (city: string) => addFavorite(normalizeCity(city)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const deleteFavoriteMutation = useMutation({
    mutationFn: (city: string) => deleteFavorite(normalizeCity(city)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const isFavorite = favorites.some((f) => normalizeCity(f.city) === currentCity);

  const handleToggleFavorite = () => {
    addFavoriteMutation.mutate(currentCity);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCity.trim()) {
      setCurrentCity(normalizeCity(searchCity.trim()));
      setSearchCity("");
    }
  };

  const uniqueFavorites = Array.from(
    new Map(favorites.map(fav => [normalizeCity(fav.city), fav])).values()
  );

  const getWeatherCardStyles = (description: string) => {
    const desc = description.toLowerCase();
    const isAtmospheric = desc.includes('nub') || desc.includes('cloud') || desc.includes('rain') || desc.includes('lluvia') || desc.includes('storm') || desc.includes('tormenta');
    
    if (isAtmospheric) {
      return "bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-blue-950/50 backdrop-blur-md border-slate-700/50 text-white shadow-2xl";
    }
    return "border-primary/10 shadow-lg shadow-primary/5";
  };


  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-14 h-14 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>

          {/* Search Form Skeleton */}
          <div className="flex items-center gap-2 max-w-md">
            <Skeleton className="h-10 flex-1 rounded-md" />
            <Skeleton className="h-10 w-20 rounded-md" />
          </div>

          {/* Tabs and Main Content Skeleton */}
          <div className="space-y-6 w-full">
            <Skeleton className="h-10 w-full max-w-[400px] rounded-md" />
            
            <div className="grid gap-6">
              <Card className="overflow-hidden border-primary/10">
                <CardHeader className="bg-primary/5 pb-4 border-b flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-4 h-4 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <Skeleton className="w-8 h-8 rounded-full" />
                </CardHeader>
                <CardContent className="pt-8 space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-2">
                      <Skeleton className="h-16 w-32" />
                      <Skeleton className="h-6 w-40" />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 max-w-md w-full">
                      <Skeleton className="h-20 w-full rounded-xl" />
                      <Skeleton className="h-20 w-full rounded-xl" />
                    </div>
                  </div>
                </CardContent>
              </Card>


              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-1.5">
              <Cloud className="w-8 h-8 text-primary" />
              <Thermometer className="w-5 h-5 text-primary/70" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight uppercase">EL CIELO DE MEDELLÍN</h1>
              <p className="text-muted-foreground">Bienvenido de nuevo, {session.user?.name}</p>
            </div>
          </div>
          <button 
            onClick={() => {
              refetch();
              queryClient.invalidateQueries({ queryKey: ["history"] });
            }}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors self-start md:self-center"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar ciudad (ej. London, Bogota)..." 
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" disabled={isLoading || !searchCity.trim()}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
          </Button>
        </form>

        <Tabs defaultValue="current" className="w-full space-y-6">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="current" className="flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              Clima Actual
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-6">
            {/* Favorites Section */}
            {uniqueFavorites.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Heart className="w-3 h-3 fill-primary text-primary" />
                  Mis Ciudades Favoritas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {uniqueFavorites.map((fav) => (
                    <div key={normalizeCity(fav.city)} className="group relative">
                      <Button
                        variant={currentCity === normalizeCity(fav.city) ? "default" : "secondary"}
                        size="sm"
                        className="rounded-full h-8 pl-4 pr-8 transition-all"
                        onClick={() => setCurrentCity(normalizeCity(fav.city))}
                      >
                        {fav.city}
                      </Button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFavoriteMutation.mutate(fav.city);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                        disabled={deleteFavoriteMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Weather Card */}
            {isLoading ? (
              <div className="grid gap-6">
                <Card className="overflow-hidden border-primary/10">
                  <CardHeader className="bg-primary/5 pb-4 border-b flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-4 h-4 rounded-full" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                    <Skeleton className="w-8 h-8 rounded-full" />
                  </CardHeader>
                  <CardContent className="pt-8 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                      <div className="space-y-2">
                        <Skeleton className="h-16 w-32" />
                        <Skeleton className="h-6 w-40" />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 max-w-md w-full">
                        <Skeleton className="h-20 w-full rounded-xl" />
                        <Skeleton className="h-20 w-full rounded-xl" />
                      </div>
                    </div>
                  </CardContent>
                </Card>


                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            ) : isError ? (
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                  <p className="text-destructive font-medium">No se pudo cargar el clima para "{currentCity}"</p>
                  <p className="text-sm text-muted-foreground">Ocurrió un error al conectar con el servidor o la ciudad no existe.</p>
                  <Button variant="outline" size="sm" onClick={() => setCurrentCity(normalizeCity("Medellin"))} className="mt-2">
                    Volver a Medellín
                  </Button>
                </CardContent>
              </Card>
            ) : weather ? (
              <div className="grid gap-6">
                <Card className={`overflow-hidden transition-all duration-500 ${getWeatherCardStyles(weather.description)}`}>
                  <CardHeader className={`${weather.description.toLowerCase().includes('nub') || weather.description.toLowerCase().includes('cloud') || weather.description.toLowerCase().includes('rain') ? 'bg-white/5' : 'bg-primary/5'} pb-4 border-b`}>
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-2 ${weather.description.toLowerCase().includes('nub') || weather.description.toLowerCase().includes('cloud') || weather.description.toLowerCase().includes('rain') ? 'text-blue-200' : 'text-primary'}`}>
                        <MapPin className="w-4 h-4" />
                        <CardTitle className="text-lg font-semibold">{weather.city}</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`rounded-full ${isFavorite ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-primary'}`}
                        onClick={handleToggleFavorite}
                        disabled={addFavoriteMutation.isPending}
                      >
                        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-8 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-6xl font-bold tracking-tighter">{Math.round(weather.temperature)}°</span>
                          <span className={`text-2xl font-medium ${weather.description.toLowerCase().includes('nub') || weather.description.toLowerCase().includes('cloud') || weather.description.toLowerCase().includes('rain') ? 'text-blue-200/70' : 'text-muted-foreground'}`}>C</span>
                        </div>
                        <p className={`text-xl font-medium capitalize ${weather.description.toLowerCase().includes('nub') || weather.description.toLowerCase().includes('cloud') || weather.description.toLowerCase().includes('rain') ? 'text-blue-100/90' : 'text-muted-foreground'}`}>
                          {weather.description}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 max-w-md">
                        <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-white/10 border border-white/10 shadow-sm">
                              <Thermometer className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                              <p className="text-xs text-blue-200/70 font-medium uppercase tracking-wider">Temperatura</p>
                              <p className="text-lg font-bold text-white">{weather.temperature}°C</p>
                            </div>
                          </div>
                          {weather.temperature > 25 && (
                            <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 border-orange-500/30">
                              Calor
                            </Badge>
                          )}
                          {weather.temperature < 15 && (
                            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border-blue-500/30">
                              Fresco
                            </Badge>
                          )}
                        </div>
                        
                        <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-white/10 border border-white/10 shadow-sm">
                              <Droplets className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-xs text-blue-200/70 font-medium uppercase tracking-wider">Humedad</p>
                              <p className="text-lg font-bold text-white">{weather.humidity}%</p>
                            </div>
                          </div>
                          {weather.humidity > 70 && (
                            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border-blue-500/30">
                              Húmedo
                            </Badge>
                          )}
                          {weather.humidity < 30 && (
                            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border-yellow-500/30">
                              Seco
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>


                <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                  <h3 className="font-semibold mb-2">Consejo para {weather.city}</h3>
                  <p className="text-sm text-muted-foreground">
                    {weather.temperature > 25 
                      ? `Hace calor en ${weather.city}. Mantente hidratado y busca la sombra.` 
                      : `El clima está agradable en ${weather.city}. Un buen momento para un paseo.`}
                  </p>
                </div>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="history">
            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Historial de Búsquedas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <p className="text-muted-foreground">No hay búsquedas recientes.</p>
                    <p className="text-xs text-muted-foreground/60">Las ciudades que busques aparecerán aquí.</p>
                  </div>
                ) : (
                  <div className="divide-y border rounded-lg overflow-hidden">
                    {[...history].reverse().slice(0, 10).map((entry, i) => (
                      <div 
                        key={`${entry.city}-${i}`}
                        className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors cursor-pointer group"
                        onClick={() => setCurrentCity(normalizeCity(entry.city))}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium capitalize">{entry.city}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(entry.searched_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Search className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
