import React from "react";
import { NodeProps } from "react-flow-renderer";
import Node from "components/Node";
import useAudioWorkletNode from "hooks/nodes/useAudioWorkletNode";

function VocalTubeModel({ data, id, selected, type }: NodeProps) {
  const { onChange } = data;

  useAudioWorkletNode(id, "vocal-tube-processor", { numberOfInputs: 0, processorOptions: {} }, []);

  return (
    <Node id={id} outputs={["output"]} type={type}>
      {selected && (
        <div className="customNode_editor nodrag">
          <div className="customNode_item"></div>
        </div>
      )}
    </Node>
  );
}

export default React.memo(VocalTubeModel);
