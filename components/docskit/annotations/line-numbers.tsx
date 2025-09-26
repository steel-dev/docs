import { type AnnotationHandler, InnerLine } from "codehike/code";
import { GeistMono } from "geist/font/mono";

export const lineNumbers: AnnotationHandler = {
  name: "line-numbers",
  Line: (props) => {
    const width = props.totalLines.toString().length + 1;
    return (
      <>
        <span
          style={{ minWidth: `${width}ch` }}
          className={`text-right select-none mr-1 text-[var(--ch-26)]`}
        >
          {props.lineNumber}
        </span>
        <InnerLine merge={props} />
      </>
    );
  },
};
