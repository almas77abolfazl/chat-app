import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HttpRequestService {
  readonly ROOT_URL: string;

  constructor(private http: HttpClient) {
    this.ROOT_URL = 'http://192.168.247.142:3000/v1';
  }

  public get(
    uri: string,
    headers?: HttpHeaders,
    params?: HttpParams
  ): Observable<any> {
    headers = headers ?? new HttpHeaders();
    return this.http.get(`${this.ROOT_URL}/${uri}`, { headers, params });
  }

  public getById(uri: string, id: string, headers?: any): Observable<any> {
    headers = headers ?? new HttpHeaders();
    return this.http.get(`${this.ROOT_URL}/${uri}/${id}`, { headers });
  }

  public post(uri: string, payload: Object, headers?: any): Observable<any> {
    headers = headers ?? new HttpHeaders();
    return this.http.post(`${this.ROOT_URL}/${uri}`, payload, { headers });
  }

  public put(
    uri: string,
    id: string,
    payload: Object,
    headers?: any
  ): Observable<any> {
    headers = headers ?? new HttpHeaders();
    return this.http.put(`${this.ROOT_URL}/${uri}/${id}`, payload, { headers });
  }

  public delete(uri: string, id: string, headers?: any): Observable<any> {
    headers = headers ?? new HttpHeaders();
    return this.http.delete(`${this.ROOT_URL}/${uri}/${id}`, { headers });
  }
}
