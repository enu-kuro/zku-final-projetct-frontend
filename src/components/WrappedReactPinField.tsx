import { MutableRefObject, useEffect, useRef } from "react";
import ReactPinField, { PinField, ReactPinFieldProps } from "react-pin-field";

// dirty hack...
// https://github.com/soywod/react-pin-field/issues/45
const WrappedReactPinField: React.FC<
  ReactPinFieldProps & {
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/31065
    resetPinFieldRef?: MutableRefObject<(() => void) | undefined>;
  }
> = ({ resetPinFieldRef, ...props }) => {
  const pinFieldRef = useRef<PinField>(null);
  useEffect(() => {
    pinFieldRef.current?.inputs[0].focus();
    if (resetPinFieldRef) {
      resetPinFieldRef.current = reset;
    }
  }, [resetPinFieldRef]);

  const reset = () => {
    if (pinFieldRef.current) {
      for (let i = 0; i < pinFieldRef.current.inputs.length; i++) {
        pinFieldRef.current.inputs[i].value = "";
        pinFieldRef.current.inputs[i].setCustomValidity("");
      }
      pinFieldRef.current?.removeAttribute("completed");
      pinFieldRef.current?.inputs[0].focus();
    }
  };

  const handleOnChange = (code: string) => {
    if (/^(?!.*(.).*\1)[0-9]{0,4}/.test(code)) {
      props.onChange && props.onChange(code);
    } else {
      pinFieldRef.current!.inputs[code.length - 1].setCustomValidity(
        "Invalid key"
      );
      pinFieldRef.current!.inputs[code.length - 1].value = "";
      pinFieldRef.current!.inputs[code.length - 1].focus();
    }
  };

  const handleOnComplete = (code: string) => {
    if (!/^(?!.*(.).*\1)[0-9]{4}/.test(code)) {
      pinFieldRef.current!.removeAttribute("completed");
      pinFieldRef.current!.inputs[code.length - 1].setCustomValidity(
        "Invalid key"
      );
      pinFieldRef.current!.inputs[code.length - 1].value = "";
      pinFieldRef.current!.inputs[code.length - 1].focus();
    }
  };
  return (
    <ReactPinField
      {...props}
      onChange={handleOnChange}
      onComplete={handleOnComplete}
      ref={pinFieldRef}
    />
  );
};
export default WrappedReactPinField;
