package responses

type Error struct {
	Status bool   `json:"status"`
	Msg    string `json:"msg"`
	Code   int    `json:"code"`
}

// Response defines http response for the client
type Response struct {
	Data        interface{} `json:"data,omitempty"`
	Metadata    interface{} `json:"metadata,omitempty"`
	File        []byte      `json:"-"`
	ContentType string      `json:"-"`
	Error       Error       `json:"error"`
	StatusCode  int         `json:"-"`
}

// SetError set the response to return the given error.
// code is http status code, http.StatusInternalServerError is the default value
func (res *Response) SetError(err error, code int) {
	if err != nil {
		res.Error = Error{
			Code:   code,
			Msg:    err.Error(),
			Status: true,
		}
	}

}
