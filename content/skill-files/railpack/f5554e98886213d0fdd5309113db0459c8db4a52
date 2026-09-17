package plan

type PlanPackages struct {
	Apt  []string          `json:"apt,omitempty"`
	Mise map[string]string `json:"mise,omitempty"`
}

func NewPlanPackages() *PlanPackages {
	return &PlanPackages{
		Apt:  []string{},
		Mise: map[string]string{},
	}
}

func (p *PlanPackages) AddAptPackage(pkg string) {
	p.Apt = append(p.Apt, pkg)
}

func (p *PlanPackages) AddMisePackage(pkg string, version string) {
	p.Mise[pkg] = version
}
