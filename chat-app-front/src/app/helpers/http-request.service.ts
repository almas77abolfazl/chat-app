import { HttpClient, HttpEvent, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HttpRequestService {
  readonly ROOT_URL: string = environment.apiUrl;

  constructor(private http: HttpClient) {}

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

  public delete(uri: string, id?: string, headers?: any, body?: any): Observable<any> {
    headers = headers ?? new HttpHeaders();
    const url = id ? `${this.ROOT_URL}/${uri}/${id}` : `${this.ROOT_URL}/${uri}`;
    return this.http.delete(url, { headers, body });
  }

  public postFile(uri: string, formData: FormData, headers?: HttpHeaders): Observable<any> {
    // Do not set Content-Type for FormData; browser sets multipart boundary automatically
    return this.http.post(`${this.ROOT_URL}/${uri}`, formData, { headers });
  }

  public postFileWithProgress(uri: string, formData: FormData, headers?: HttpHeaders): Observable<HttpEvent<any>> {
    return this.http.post<any>(`${this.ROOT_URL}/${uri}`, formData, {
      headers,
      reportProgress: true,
      observe: 'events',
    });
  }
}
