package generate

type Metadata struct {
	Properties map[string]string `json:"properties"`
}

func NewMetadata() *Metadata {
	return &Metadata{
		Properties: make(map[string]string),
	}
}

func (m *Metadata) Set(key string, value string) {
	if value == "" {
		return
	}

	m.Properties[key] = value
}

func (m *Metadata) SetBool(key string, value bool) {
	if value {
		m.Properties[key] = "true"
	}
}

func (m *Metadata) Get(key string) string {
	return m.Properties[key]
}
