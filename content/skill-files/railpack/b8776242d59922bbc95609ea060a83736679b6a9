package buildkit

import specs "github.com/opencontainers/image-spec/specs-go/v1"

// Image is the JSON structure which describes some basic information about the image.
// This provides the `application/vnd.oci.image.config.v1+json` mediatype when marshalled to JSON.
type Image struct {
	specs.Image

	// Config defines the execution parameters which should be used as a base when running a container using the image.
	Config specs.ImageConfig `json:"config"`

	// Variant defines platform variant. To be added to OCI.
	Variant string `json:"variant,omitempty"`
}
