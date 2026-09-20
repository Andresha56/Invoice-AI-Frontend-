import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Cropper, { type Area } from "react-easy-crop";
import type { AddOn } from "@/archetype/add-on";
import { AddOnButton } from "../Add-on/addOn-button";
import { FileHeader } from "./header";
import { Button } from "../button";

interface FileUploaderProps {
  addOn: AddOn;
}

export const FileUploader = ({ addOn }: FileUploaderProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const Icon = addOn.icon;

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = useCallback(() => {
    // just to ignore husky check
    alert(croppedAreaPixels);

    setIsOpen(false);
  }, [croppedAreaPixels]);

  const handleCancel = useCallback(() => {
    setImage(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setIsOpen(false);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },

    maxSize: 1 * 1024 * 1024,

    multiple: false,

    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];

      if (!file) return;

      const imageUrl = URL.createObjectURL(file);

      setImage(imageUrl);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    },
  });

  return (
    <>
      {/* Same Add-on Card */}

      <AddOnButton addOn={addOn} handleFileClick={handleOpen} />

      {/* Upload / Crop Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
            {!image ? (
              <>
                {/* Modal Header */}
                <FileHeader addOn={addOn} handleCancel={handleCancel} />

                {/* Dropzone */}
                <div className="p-4">
                  <div
                    {...getRootProps()}
                    className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-6 py-8 text-center transition hover:border-zinc-400 hover:bg-zinc-100"
                  >
                    <input {...getInputProps()} />

                    <div
                      className={`mb-3 flex h-11 w-11 items-center justify-center rounded-lg ${addOn.iconClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <p className="text-sm font-medium text-zinc-900">
                      Upload {addOn.label.toLowerCase()}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Drag & drop or click to browse
                    </p>

                    <p className="mt-2 text-[11px] text-zinc-400">
                      PNG, JPG, JPEG or WEBP · Max 1 MB
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end border-t border-zinc-100 px-4 py-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-md px-3 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Crop Header */}

                <FileHeader addOn={addOn} handleCancel={handleCancel} />
                {/* Crop Area */}
                <div className="relative mx-4 mt-4 h-[320px] overflow-hidden rounded-lg bg-zinc-950">
                  <Cropper
                    image={image}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={handleCropComplete}
                    cropShape="rect"
                    showGrid={false}
                  />
                </div>

                {/* Zoom */}
                <div className="px-5 py-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-600">
                      Zoom
                    </span>

                    <span className="text-[11px] tabular-nums text-zinc-400">
                      {zoom.toFixed(1)}×
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400">−</span>

                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900"
                    />

                    <span className="text-xs text-zinc-400">+</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-4 py-3">
                  <Button
                    type="button"
                    label="Cancel"
                    handleSave={handleCancel}
                    variant="secondary"
                  />

                  <Button
                    type="button"
                    label="Save"
                    handleSave={handleSave}
                    variant="primary"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
