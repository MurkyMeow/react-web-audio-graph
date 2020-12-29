import { createContext, DependencyList, useContext, useEffect, useMemo } from "react";
import { useStoreState } from "react-flow-renderer";
import { connectNodes } from "utils/handles";
import { AudioContext } from "context/AudioContext";

export type ComplexAudioNode<Input extends AudioNode | undefined, Output extends AudioNode | undefined> = {
  input: Input;
  output: Output;
};

export type AnyAudioNode = AudioNode | ComplexAudioNode<AudioNode, AudioNode>;

export type NodeContextType = {
  addNode: (id: string, node: AnyAudioNode) => void;
  getNode: (id: string) => AnyAudioNode;
  nodes: Record<string, AnyAudioNode>;
  removeNode: (id: string) => void;
};

interface NodeFactory<T> {
  (context: AudioContext): T;
}

interface ComplexNodeFactory<Input extends AudioNode | undefined, Output extends AudioNode | undefined> {
  (context: AudioContext): ComplexAudioNode<Input, Output>;
}

export function isComplexAudioNode(node: AnyAudioNode): node is ComplexAudioNode<AudioNode, AudioNode> {
  return node && "input" in node && "output" in node;
}

export const NodeContext = createContext<NodeContextType>(null!);

export function useNodeContext() {
  return useContext(NodeContext);
}

export function useNode<T extends AudioNode>(id: string, nodeFactory: NodeFactory<T>, dependencies?: DependencyList): T;
export function useNode<Input extends AudioNode | undefined, Output extends AudioNode | undefined>(
  id: string,
  nodeFactory: ComplexNodeFactory<Input, Output>,
  dependencies?: DependencyList
): ComplexAudioNode<Input, Output>;
export function useNode(
  id: string,
  nodeFactory: ComplexNodeFactory<AudioNode, AudioNode>,
  dependencies: DependencyList = []
) {
  const context = useContext(AudioContext);
  const { addNode, getNode, removeNode } = useNodeContext();
  const edges = useStoreState(store => store.edges);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const node = useMemo(() => nodeFactory(context), dependencies);

  useEffect(() => {
    addNode(id, node);

    // try reconnecting
    edges.filter(edge => edge.source === id || edge.target === id).forEach(edge => connectNodes(edge, getNode));

    return () => {
      removeNode(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addNode, getNode, node, id, removeNode]);

  return node;
}
