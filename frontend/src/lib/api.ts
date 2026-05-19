import { getSession } from "next-auth/react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function authHeaders() {
  const session = await getSession();
  const token = (session as any)?.accessToken;
  
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail ?? "Error desconocido");
  }
  return res.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeatherData {
  city: string;
  temperature: number;
  humidity: number;
  description: string;
}

export interface Favorite {
  city: string;
}

export interface HistoryEntry {
  city: string;
  searched_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function register(username: string, email: string, password: string) {
  const res = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  return handleResponse<{ message: string }>(res);
}

export async function login(username: string, password: string): Promise<Token> {
  // FastAPI OAuth2 espera form-data, no JSON
  const form = new URLSearchParams({ username, password });
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const data = await handleResponse<Token>(res);
  return data;
}

// ─── Weather ──────────────────────────────────────────────────────────────────

export async function getWeather(city: string): Promise<WeatherData> {
  const res = await fetch(`${BASE_URL}/weather/${encodeURIComponent(city)}`, {
    headers: await authHeaders(),
  });
  return handleResponse<WeatherData>(res);
}

// ─── Favorites ────────────────────────────────────────────────────────────────

export async function getFavorites(): Promise<Favorite[]> {
  const res = await fetch(`${BASE_URL}/favorites`, { headers: await authHeaders() });
  const data = await handleResponse<{ favorites: Favorite[] }>(res);
  return data.favorites;
}

export async function addFavorite(city: string) {
  const res = await fetch(`${BASE_URL}/favorites/${encodeURIComponent(city)}`, {
    method: "POST",
    headers: await authHeaders(),
  });
  return handleResponse<{ message: string }>(res);
}

export async function removeFavorite(city: string) {
  const res = await fetch(`${BASE_URL}/favorites/${encodeURIComponent(city)}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  return handleResponse<{ message: string }>(res);
}

export async function deleteFavorite(city: string) {
  const res = await fetch(`${BASE_URL}/favorites/${encodeURIComponent(city)}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  return handleResponse<{ message: string }>(res);
}

// ─── History ──────────────────────────────────────────────────────────────────

export async function getWeatherHistory(): Promise<HistoryEntry[]> {
  const res = await fetch(`${BASE_URL}/history`, { headers: await authHeaders() });
  const data = await handleResponse<{ history: HistoryEntry[] }>(res);
  return data.history;
}