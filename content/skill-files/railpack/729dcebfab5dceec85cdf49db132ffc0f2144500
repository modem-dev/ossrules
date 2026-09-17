package build_llb

import (
	"github.com/moby/buildkit/client/llb"
	"github.com/railwayapp/railpack/buildkit/graph"
	"github.com/railwayapp/railpack/core/plan"
)

type StepNode struct {
	Step       *plan.Step
	State      *llb.State
	parents    []graph.Node
	children   []graph.Node
	Processed  bool
	InProgress bool

	InputEnv  BuildEnvironment
	OutputEnv BuildEnvironment
}

func (n *StepNode) GetName() string {
	return n.Step.Name
}

func (n *StepNode) GetParents() []graph.Node {
	return n.parents
}

func (n *StepNode) SetParents(parents []graph.Node) {
	n.parents = parents
}

func (n *StepNode) GetChildren() []graph.Node {
	return n.children
}

func (n *StepNode) SetChildren(children []graph.Node) {
	n.children = children
}

func (node *StepNode) getPathList() []string {
	pathList := make([]string, 0)
	pathList = append(pathList, node.OutputEnv.PathList...)
	return pathList
}
