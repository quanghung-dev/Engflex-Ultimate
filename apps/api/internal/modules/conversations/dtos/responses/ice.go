package responses

// IceServer is one STUN/TURN entry handed to the browser.
type IceServer struct {
	URLs       []string `json:"urls"`
	Username   *string  `json:"username,omitempty"`
	Credential *string  `json:"credential,omitempty"`
}

// IceConfig is the engine-supplied ICE configuration for a session.
type IceConfig struct {
	IceServers []IceServer `json:"iceServers"`
}
