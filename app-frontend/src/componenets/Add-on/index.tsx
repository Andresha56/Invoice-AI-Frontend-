import type { FC } from "react";
import { ADD_ON_Type, type AddOn } from "@/archetype/add-on";
import { FileUploader } from "../file-uploader";
import { AddOnButton } from "./addOn-button";

interface AddOnButtonsProps {
  addOn: AddOn;
  handleAddOnClick: (addOn: AddOn) => void;
  onUpload?: (addOnId: string, base64: string) => void;
  uploadedAssets?: Record<string, string>;
}

export const AddOnButtons: FC<AddOnButtonsProps> = ({
  addOn,
  handleAddOnClick,
  onUpload,
  uploadedAssets,
}) => {
  const isUploaded = Boolean(uploadedAssets?.[addOn.id]);

  return (
    <>
      {addOn.type === ADD_ON_Type.File ? (
        <FileUploader
          addOn={addOn}
          onUpload={onUpload}
          isUploaded={isUploaded}
        />
      ) : (
        <AddOnButton addOn={addOn} handleAddOnTextClick={handleAddOnClick} />
      )}
    </>
  );
};
