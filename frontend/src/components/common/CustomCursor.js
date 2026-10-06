import { useEffect } from "react";

const CustomCursor = () => {
  useEffect(() => {
    document.body.classList.remove("custom-cursor-active");
  }, []);

  return null;
};

export default CustomCursor;
