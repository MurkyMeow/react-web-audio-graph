import React, { useContext, useEffect, useMemo } from "react";
import { NodeProps } from "react-flow-renderer";
import { AudioContext } from "context/AudioContext";
import { useNode } from "context/NodeContext";
import Node from "components/Node";

function ConstantSource({ data, id, selected, type }: NodeProps) {
  const { offset = 1, onChange } = data;

  // AudioNode
  const context = useContext(AudioContext);
  const node = useMemo<ConstantSourceNode>(() => context.createConstantSource(), [context]);
  useEffect(() => {
    node.start();
    return () => node.stop();
  }, [node]);
  useNode(id, node);

  // AudioParam
  useEffect(() => (node.offset.value = offset), [node, offset]);

  return (
    <Node id={id} outputs={["output"]} title={`Constant: ${offset}`} type={type}>
      {selected && (
        <div className="customNode_editor">
          <div className="customNode_item">
            <input
              className="nodrag"
              type="number"
              onChange={e => onChange({ offset: +e.target.value })}
              style={{ width: "100%" }}
              value={offset}
            />
          </div>
        </div>
      )}
    </Node>
  );
}

export default React.memo(ConstantSource);
