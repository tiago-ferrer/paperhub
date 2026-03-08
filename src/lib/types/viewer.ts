export interface Viewer {
  viewer_username: string
  granted_at: string
}

export interface AddViewerPayload {
  viewer_username: string
}
