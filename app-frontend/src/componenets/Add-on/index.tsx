import type { FC } from "react";
import { ADD_ON_Type, type AddOn } from "@/archetype/add-on";
import { FileUploader } from "../file-uploader";
import { AddOnButton } from "./addOn-button";

interface AddOnButtonsProps {
  addOn: AddOn;
  handleAddOnClick: (addOn: AddOn) => void;
}

export const AddOnButtons: FC<AddOnButtonsProps> = ({
  addOn,
  handleAddOnClick,
}) => {
  return (
    <>
      {addOn.type === ADD_ON_Type.File ? (
        <FileUploader addOn={addOn} />
      ) : (
        <AddOnButton addOn={addOn} handleAddOnTextClick={handleAddOnClick} />
      )}
    </>
  );
};
