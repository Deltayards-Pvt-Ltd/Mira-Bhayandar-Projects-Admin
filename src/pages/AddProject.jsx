import React, { useContext, useEffect, useRef, useState } from "react";
import { AppConetxt } from "../context/context";
import axios from "axios";
import { toast } from "react-toastify";
import {
  galleryTitleFromFile,
  uploadProjectFilesToS3,
} from "../utils/s3Upload";
import FilePreviewCard from "../components/FilePreviewCard";
import { PLAN_OPTIONS } from "../constants/project";

const resetFileInput = (ref) => {
  if (ref?.current) ref.current.value = "";
};

const PROJECT_STATUSES = ["Under Construction", "Ready to Move","Upcoming"];

const PROPERTY_TYPES = [
  { value: "", label: "— Select property type —" },
  { value: "Residential", label: "Residential" },
  { value: "Commercial", label: "Commercial" },
  { value: "Residential & Commercial", label: "Residential & Commercial" },
];

const MONTHS = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const AddProject = () => {
  const { backendUrl, navigate } = useContext(AppConetxt);

  const [form, setForm] = useState({
    name: "",
    builder: "",
    location: "",
    address: "",
    propertyType: "",
    status: "Under Construction",
    contactNumber: "",
    latitude: "",
    longitude: "",
    description: "",
    reraNo: "",
    reraMonth: "",
    reraYear: "",
    active: true,
  });

  const [featureInput, setFeatureInput] = useState("");
  const [features, setFeatures] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const galleryInputRef = useRef(null);
  const [browcherPdfs, setBrowcherPdfs] = useState([]);

  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const logoInputRef = useRef(null);
  const [builderLogo, setBuilderLogo] = useState(null);
  const [builderLogoPreview, setBuilderLogoPreview] = useState(null);
  const builderLogoInputRef = useRef(null);
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const coverImageInputRef = useRef(null);
  const [coverVideo, setCoverVideo] = useState(null);
  const [coverVideoPreview, setCoverVideoPreview] = useState(null);
  const coverVideoInputRef = useRef(null);
  const [bannerImage, setBannerImage] = useState(null);
  const [bannerImagePreview, setBannerImagePreview] = useState(null);
  const bannerImageInputRef = useRef(null);
  const ocCertInputRef = useRef(null);
  const [reraCertificates, setReraCertificates] = useState([]);
  const [reraScannerImages, setReraScannerImages] = useState([]);
  const [ocCertificate, setOcCertificate] = useState(null);
  const [walkthroughVideo, setWalkthroughVideo] = useState(null);
  const [walkthroughVideoPreview, setWalkthroughVideoPreview] = useState(null);
  const walkthroughVideoInputRef = useRef(null);

  const [layouts, setLayouts] = useState([]);
  const [plans, setPlans] = useState([]);

  const togglePlan = (plan) =>
    setPlans((prev) =>
      prev.includes(plan) ? prev.filter((p) => p !== plan) : [...prev, plan]
    );

  const [submitting, setSubmitting] = useState(false);

  const addFeature = () => {
    const tag = featureInput.trim();
    if (!tag) return;
    if (!features.includes(tag)) setFeatures((prev) => [...prev, tag]);
    setFeatureInput("");
  };
  const removeFeature = (tag) =>
    setFeatures((prev) => prev.filter((f) => f !== tag));

  const onGalleryButtonClick = () => galleryInputRef.current?.click();
  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newFiles = files.map((file, idx) => ({
      id: Date.now() + idx,
      file,
      preview: URL.createObjectURL(file),
    }));
    setGalleryImages((prev) => [...prev, ...newFiles]);
  };
  const removeGalleryImage = (id) =>
    setGalleryImages((prev) => {
      const rem = prev.find((x) => x.id === id);
      if (rem) URL.revokeObjectURL(rem.preview);
      return prev.filter((x) => x.id !== id);
    });

  const onCoverImageButtonClick = () => coverImageInputRef.current?.click();
  const handleCoverImageChange = (e) => {
    if (coverImagePreview) URL.revokeObjectURL(coverImagePreview);
    const file = e.target.files?.[0];
    setCoverImagePreview(file ? URL.createObjectURL(file) : null);
    setCoverImage(file || null);
    e.target.value = null;
  };

  const onBannerImageButtonClick = () => bannerImageInputRef.current?.click();
  const handleBannerImageChange = (e) => {
    if (bannerImagePreview) URL.revokeObjectURL(bannerImagePreview);
    const file = e.target.files?.[0];
    setBannerImagePreview(file ? URL.createObjectURL(file) : null);
    setBannerImage(file || null);
    e.target.value = null;
  };

  const onLogoButtonClick = () => logoInputRef.current?.click();
  const handleLogoChange = (e) => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    const file = e.target.files?.[0];
    setLogoPreview(file ? URL.createObjectURL(file) : null);
    setLogo(file || null);
    e.target.value = null;
  };

  const onBuilderLogoButtonClick = () => builderLogoInputRef.current?.click();
  const handleBuilderLogoChange = (e) => {
    if (builderLogoPreview) URL.revokeObjectURL(builderLogoPreview);
    const file = e.target.files?.[0];
    setBuilderLogoPreview(file ? URL.createObjectURL(file) : null);
    setBuilderLogo(file || null);
    e.target.value = null;
  };

  const addLayout = () =>
    setLayouts((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: "",
        area: "",
        price: "",
        imageFiles: [],
      },
    ]);
  const removeLayout = (id) =>
    setLayouts((prev) => { 
      const rem = prev.find((x) => x.id === id);
      (rem?.imageFiles || []).forEach((img) => {
        if (img.preview) URL.revokeObjectURL(img.preview);
      });
      return prev.filter((x) => x.id !== id);
    });
  const handleLayoutChange = (id, field, value) =>
    setLayouts((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  const handleLayoutImages = (id, e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setLayouts((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const added = files.map((file, idx) => ({
          id: Date.now() + idx,
          file,
          preview: URL.createObjectURL(file),
        }));
        return { ...l, imageFiles: [...(l.imageFiles || []), ...added] };
      })
    );
    e.target.value = null;
  };

  const removeLayoutImage = (layoutId, imageId) => {
    setLayouts((prev) =>
      prev.map((l) => {
        if (l.id !== layoutId) return l;
        const rem = (l.imageFiles || []).find((img) => img.id === imageId);
        if (rem?.preview) URL.revokeObjectURL(rem.preview);
        return {
          ...l,
          imageFiles: (l.imageFiles || []).filter((img) => img.id !== imageId),
        };
      })
    );
  };

  const clearLogo = () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogo(null);
    setLogoPreview(null);
    resetFileInput(logoInputRef);
  };

  const clearBuilderLogo = () => {
    if (builderLogoPreview) URL.revokeObjectURL(builderLogoPreview);
    setBuilderLogo(null);
    setBuilderLogoPreview(null);
    resetFileInput(builderLogoInputRef);
  };

  const clearCoverImage = () => {
    if (coverImagePreview) URL.revokeObjectURL(coverImagePreview);
    setCoverImage(null);
    setCoverImagePreview(null);
    resetFileInput(coverImageInputRef);
  };

  const clearBannerImage = () => {
    if (bannerImagePreview) URL.revokeObjectURL(bannerImagePreview);
    setBannerImage(null);
    setBannerImagePreview(null);
    resetFileInput(bannerImageInputRef);
  };

  const handleCoverVideoChange = (e) => {
    if (coverVideoPreview) URL.revokeObjectURL(coverVideoPreview);
    const file = e.target.files?.[0];
    setCoverVideoPreview(file ? URL.createObjectURL(file) : null);
    setCoverVideo(file || null);
    e.target.value = null;
  };

  const clearCoverVideo = () => {
    if (coverVideoPreview) URL.revokeObjectURL(coverVideoPreview);
    setCoverVideo(null);
    setCoverVideoPreview(null);
    resetFileInput(coverVideoInputRef);
  };

  const addReraCert = () =>
    setReraCertificates((prev) => [
      ...prev,
      { id: Date.now(), title: "", file: null, preview: null },
    ]);
  const removeReraCert = (id) =>
    setReraCertificates((prev) => {
      const rem = prev.find((r) => r.id === id);
      if (rem?.preview) URL.revokeObjectURL(rem.preview);
      return prev.filter((r) => r.id !== id);
    });
  const handleReraCertChange = (id, field, value) =>
    setReraCertificates((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  const handleReraCertFile = (id, e) => {
    const file = e.target.files?.[0];
    setReraCertificates((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (r.preview) URL.revokeObjectURL(r.preview);
        return {
          ...r,
          file: file || null,
          preview: file ? URL.createObjectURL(file) : null,
        };
      })
    );
    e.target.value = null;
  };

  const addReraScanner = () =>
    setReraScannerImages((prev) => [
      ...prev,
      { id: Date.now(), title: "", image: null, preview: null },
    ]);
  const removeReraScanner = (id) =>
    setReraScannerImages((prev) => {
      const rem = prev.find((r) => r.id === id);
      if (rem?.preview) URL.revokeObjectURL(rem.preview);
      return prev.filter((r) => r.id !== id);
    });
  const handleReraScannerChange = (id, field, value) =>
    setReraScannerImages((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  const handleReraScannerFile = (id, e) => {
    const file = e.target.files?.[0];
    setReraScannerImages((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (r.preview) URL.revokeObjectURL(r.preview);
        return {
          ...r,
          image: file || null,
          preview: file ? URL.createObjectURL(file) : null,
        };
      })
    );
    e.target.value = null;
  };

  const clearOcCertificate = () => {
    setOcCertificate(null);
    resetFileInput(ocCertInputRef);
  };

  const addBrowcherPdf = () =>
    setBrowcherPdfs((prev) => [
      ...prev,
      { id: Date.now(), title: "", file: null, preview: null },
    ]);
  const removeBrowcherPdf = (id) =>
    setBrowcherPdfs((prev) => {
      const rem = prev.find((b) => b.id === id);
      if (rem?.preview) URL.revokeObjectURL(rem.preview);
      return prev.filter((b) => b.id !== id);
    });
  const handleBrowcherPdfChange = (id, field, value) =>
    setBrowcherPdfs((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  const handleBrowcherPdfFile = (id, e) => {
    const file = e.target.files?.[0];
    setBrowcherPdfs((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        if (b.preview) URL.revokeObjectURL(b.preview);
        return {
          ...b,
          file: file || null,
          preview: file ? URL.createObjectURL(file) : null,
        };
      })
    );
    e.target.value = null;
  };

  // walk through video

  const onWalkthroughVideoButtonClick = () => walkthroughVideoInputRef.current?.click();
  const handleWalkthroughVideoChange = (e) => {
    if (walkthroughVideoPreview) URL.revokeObjectURL(walkthroughVideoPreview);
    const file = e.target.files?.[0];
    setWalkthroughVideoPreview(file ? URL.createObjectURL(file) : null);
    setWalkthroughVideo(file || null);
    e.target.value = null;
  };

  const clearWalkthroughVideo = () => {
    if (walkthroughVideoPreview) URL.revokeObjectURL(walkthroughVideoPreview);
    setWalkthroughVideo(null);
    setWalkthroughVideoPreview(null);
    resetFileInput(walkthroughVideoInputRef);
  };

  useEffect(() => {
    return () => {
      galleryImages.forEach((g) => URL.revokeObjectURL(g.preview));
      reraCertificates.forEach((r) => r.preview && URL.revokeObjectURL(r.preview));
      reraScannerImages.forEach((r) => r.preview && URL.revokeObjectURL(r.preview));
      browcherPdfs.forEach((b) => b.preview && URL.revokeObjectURL(b.preview));
      layouts.forEach(
        (l) => l.imagePreview && URL.revokeObjectURL(l.imagePreview)
      );
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      if (builderLogoPreview) URL.revokeObjectURL(builderLogoPreview);
      if (coverImagePreview) URL.revokeObjectURL(coverImagePreview);
      if (bannerImagePreview) URL.revokeObjectURL(bannerImagePreview);
      if (coverVideoPreview) URL.revokeObjectURL(coverVideoPreview);
      if (walkthroughVideoPreview) URL.revokeObjectURL(walkthroughVideoPreview);
    };
  }, []);

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!backendUrl) {
      toast.error("VITE_BACKEND_URL is not set");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Project name is required");
      return;
    }
 
    
    const completeLayouts = layouts.filter((l) => l.title?.trim());
    const completeBrowcherPdfs = browcherPdfs.filter((b) => b.title?.trim() && b.file);
    const completeReraCerts = reraCertificates.filter((r) => r.title?.trim() && r.file);
    const completeReraScanners = reraScannerImages.filter(
      (r) => r.title?.trim() && r.image
    );

    setSubmitting(true);
    try {
      const uploadEntries = [
        ...(logo ? [{ field: "logo", file: logo }] : []),
        ...(builderLogo ? [{ field: "builderLogo", file: builderLogo }] : []),
        ...(coverImage ? [{ field: "coverImage", file: coverImage }] : []),
        ...(coverVideo ? [{ field: "coverVideo", file: coverVideo }] : []),
        ...(bannerImage ? [{ field: "bannerImage", file: bannerImage }] : []),
        ...completeBrowcherPdfs.map((b) => ({ field: "browcherPdf", file: b.file })),
        ...(ocCertificate ? [{ field: "ocCertificate", file: ocCertificate }] : []),
        ...completeReraCerts.map((r) => ({ field: "reraCertificate", file: r.file })),
        ...completeReraScanners.map((r) => ({
          field: "reraScannerImage",
          file: r.image,
        })),
        ...(walkthroughVideo ? [{ field: "walkthroughVideo", file: walkthroughVideo }] : []),
        ...galleryImages.map((g) => ({ field: "galleryImages", file: g.file })),
        ...completeLayouts.flatMap((l) =>
          (l.imageFiles || []).map((img) => ({
            field: "layoutImages",
            file: img.file,
          }))
        ),
      ].filter((e) => e.file instanceof File);

      const uploaded = await uploadProjectFilesToS3(
        backendUrl,
        form.name.trim(),
        uploadEntries
      );

      const urlByField = (field) => {
        const hits = uploaded.filter((u) => u.field === field);
        return hits.map((h) => h.publicUrl);
      };

      const logoUrls = urlByField("logo");
      const builderLogoUrls = urlByField("builderLogo");
      const galleryUrls = uploaded
        .filter((u) => u.field === "galleryImages")
        .map((u) => ({
          title: galleryTitleFromFile(u.file),
          image: u.publicUrl,
        }));
      const layoutImageUrls = urlByField("layoutImages");
      const browcherPdfUrls = urlByField("browcherPdf");
      const reraCertUrls = urlByField("reraCertificate");
      const reraScannerUrls = urlByField("reraScannerImage");
      const walkthroughVideoUrl = urlByField("walkthroughVideo")[0] || "";

      let layoutImgIdx = 0;
      const layoutsPayload = completeLayouts.map((l) => {
        const images = (l.imageFiles || []).map(
          () => layoutImageUrls[layoutImgIdx++] || ""
        ).filter(Boolean);
        return {
          title: l.title.trim(),
          area: String(l.area ?? "").trim(),
          price: l.price,
          images,
          image: images[0] || "",
        };
      });

      const response = await axios.post(
        `${backendUrl}/api/project/addProject`,
        {
          name: form.name,
          builder: form.builder,
          location: form.location,
          address: form.address.trim(),
          propertyType: form.propertyType,
          plans,
          status: form.status,
          contactNumber: form.contactNumber.trim(),
          latitude: form.latitude.trim(),
          longitude: form.longitude.trim(),
          description: form.description,
          reraNo: form.reraNo.trim(),
          reraMonth: form.reraMonth || "",
          reraYear: form.reraYear || "",
          features,
          logo: logoUrls[0] || "",
          builderLogo: builderLogoUrls[0] || "",
          coverImage: urlByField("coverImage")[0] || "",
          coverVideo: urlByField("coverVideo")[0] || "",
          bannerImage: urlByField("bannerImage")[0] || "",
          browcherPdf: completeBrowcherPdfs.map((b, i) => ({
            title: b.title.trim(),
            file: browcherPdfUrls[i],
          })),
          walkthroughVideo: walkthroughVideoUrl,
          reraCertificate: completeReraCerts.map((r, i) => ({
            title: r.title.trim(),
            file: reraCertUrls[i],
          })),
          reraScannerImage: completeReraScanners.map((r, i) => ({
            title: r.title.trim(),
            image: reraScannerUrls[i],
          })),
          ocCertificate: urlByField("ocCertificate")[0] || "",
          galleryImages: galleryUrls,
          layouts: layoutsPayload,
          active: form.active,
        },
        { timeout: 60_000 }
      );
      if (response.data?.success) {
        toast.success("Project Added Successfully", { autoClose: 2000 });
        navigate("/allprojects");
      } else {
        toast.error(response.data?.message || "Could not save project");
      }
    } catch (error) {
      console.error(error);
      const msg =
        error.code === "S3_CORS"
          ? error.message
          : error.code === "ECONNABORTED"
            ? "Upload timed out — try again or use smaller files"
            : error.response?.data?.message || error.message || "Error saving project";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-form-card max-w-5xl mx-auto space-y-6">
        <h1 className="admin-page-title text-center">Add New Project</h1>

        <form onSubmit={handleSubmitForm} className="space-y-8 text-white">
          <fieldset
            disabled={submitting}
            className="space-y-8 border-0 p-0 m-0 min-w-0 disabled:opacity-60 disabled:pointer-events-none"
          >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Project Name", key: "name", placeholder: "e.g Skyline Estate", required: true },
              { label: "Builder Name", key: "builder", placeholder: "Builder Name" },
              { label: "Location", key: "location", placeholder: "Location" },
            ].map(({ label, key, placeholder, required }) => (
              <div key={key}>
                <label htmlFor={key} className="block text-sm font-semibold mb-2 text-white">
                  {label}{required ? <span className="text-red-400 ml-1">*</span> : null}
                </label>
                <input id={key} type="text" value={form[key]} required={required} placeholder={placeholder}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-md bg-gray-800 p-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500" />
              </div>
            ))}
            <div>
              <label htmlFor="propertyType" className="block text-sm font-semibold mb-2 text-white">Property type</label>
              <select id="propertyType" value={form.propertyType} onChange={(e) => setForm((prev) => ({ ...prev, propertyType: e.target.value }))}
                className="w-full border border-gray-200 rounded-md bg-gray-800 p-2 text-white focus:ring-2 focus:ring-indigo-500">
                {PROPERTY_TYPES.map(({ value, label }) => <option key={value || "none"} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-semibold mb-2 text-white">Status</label>
              <select id="status" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full border border-gray-200 rounded-md bg-gray-800 p-2 text-white focus:ring-2 focus:ring-indigo-500">
                {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-white">Available plans</label>
              <p className="text-xs text-gray-400 mb-2">Pick configurations for this project — used on the website for filters and cards.</p>
              <div className="flex flex-wrap gap-2">
                {PLAN_OPTIONS.map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => togglePlan(plan)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${
                      plans.includes(plan)
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {plan}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="contactNumber" className="block text-sm font-semibold mb-2 text-white">Contact number</label>
              <input
                id="contactNumber"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.contactNumber}
                placeholder="9404958265"
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    contactNumber: e.target.value.replace(/\D/g, "").slice(0, 10),
                  }))
                }
                className="w-full border border-gray-200 rounded-md bg-gray-800 p-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="md:col-span-2 flex items-start gap-3 rounded-md border border-gray-600 bg-gray-800/60 p-4">
              <input
                id="active"
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
                className="mt-1 h-4 w-4 rounded border-gray-500 text-indigo-500 focus:ring-indigo-500"
              />
              <div>
                <label htmlFor="active" className="block text-sm font-semibold text-white cursor-pointer">
                  Show on website
                </label>
                <p className="text-xs text-gray-400 mt-1">
                  Uncheck to hide this project from listings and detail pages on the public site.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-semibold mb-2 text-white">
              Full address <span className="text-gray-400 font-normal"></span>
            </label>
            <textarea id="address" rows={2} value={form.address}
              placeholder="Dronagiri, Plot No. 84, Kaamtha Rd, Nr, Vimla Talao, New, Uran, Mumbai"
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              className="w-full border border-gray-200 rounded-md bg-gray-800 p-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 min-h-[72px]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="latitude" className="block text-sm font-semibold mb-2 text-white">Map latitude <span className="text-gray-400 font-normal"></span></label>
              <input id="latitude" type="text" inputMode="decimal" placeholder="e.g. 19.2812" value={form.latitude}
                onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))}
                className="w-full border border-gray-200 rounded-md bg-gray-800 p-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="longitude" className="block text-sm font-semibold mb-2 text-white">Map longitude <span className="text-gray-400 font-normal"></span></label>
              <input id="longitude" type="text" inputMode="decimal" placeholder="e.g. 72.8574" value={form.longitude}
                onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))}
                className="w-full border border-gray-200 rounded-md bg-gray-800 p-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reraNo" className="block text-sm font-semibold mb-2 text-white">RERA number</label>
              <input id="reraNo" type="text" value={form.reraNo} placeholder="RERA registration no."
                onChange={(e) => setForm((prev) => ({ ...prev, reraNo: e.target.value }))}
                className="w-full border border-gray-200 rounded-md bg-gray-800 p-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-white">RERA possession (month)</label>
              <select value={form.reraMonth} onChange={(e) => setForm((prev) => ({ ...prev, reraMonth: e.target.value }))}
                className="w-full p-2 border border-gray-200 rounded-md bg-gray-800 text-white focus:ring-2 focus:ring-indigo-500">
                {MONTHS.map((m) => <option key={m || "none"} value={m}>{m || "—"}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-white">RERA possession (year)</label>
              <input type="number" placeholder="2026" value={form.reraYear}
                onChange={(e) => setForm((prev) => ({ ...prev, reraYear: e.target.value }))}
                className="w-full p-2 border border-gray-200 rounded-md bg-gray-800 text-white focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm text-white mb-2">Builder logo</label>
              <input type="file" ref={builderLogoInputRef} accept="image/*" className="hidden" onChange={handleBuilderLogoChange} />
              <button type="button" onClick={onBuilderLogoButtonClick} className="px-5 py-2 bg-white border rounded-md text-black shadow-md hover:bg-black hover:text-white transition">Upload builder logo</button>
              {builderLogoPreview && (
                <FilePreviewCard onRemove={clearBuilderLogo} ariaLabel="Remove builder logo" className="mt-2 inline-block">
                  <img src={builderLogoPreview} alt="" className="h-24 w-24 object-contain" />
                </FilePreviewCard>
              )}
            </div>
            <div>
              <label className="block text-sm text-white mb-2">Project logo</label>
              <input type="file" ref={logoInputRef} accept="image/*" className="hidden" onChange={handleLogoChange} />
              <button type="button" onClick={onLogoButtonClick} className="px-5 py-2 bg-white border rounded-md text-black shadow-md hover:bg-black hover:text-white transition">Upload project logo</button>
              {logoPreview && (
                <FilePreviewCard onRemove={clearLogo} ariaLabel="Remove project logo" className="mt-2 inline-block">
                  <img src={logoPreview} alt="" className="h-24 w-24 object-contain" />
                </FilePreviewCard>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm text-white mb-2">Cover Image</label>
            <input type="file" ref={coverImageInputRef} accept="image/*" className="hidden" onChange={handleCoverImageChange} />
            <button type="button" onClick={onCoverImageButtonClick} className="px-5 py-2 bg-white border rounded-md text-black shadow-md hover:bg-black hover:text-white transition">Upload Cover Image</button>
            {coverImagePreview && (
              <FilePreviewCard onRemove={clearCoverImage} ariaLabel="Remove cover image" className="mt-2 inline-block">
                <img src={coverImagePreview} alt="" className="h-24 w-24 object-cover" />
              </FilePreviewCard>
            )}
          </div>

          <div>
            <label className="block text-sm text-white mb-2">Banner image <span className="text-gray-400"></span></label>
            <input type="file" ref={bannerImageInputRef} accept="image/*" className="hidden" onChange={handleBannerImageChange} />
            <button type="button" onClick={onBannerImageButtonClick} className="px-5 py-2 bg-white border rounded-md text-black shadow-md hover:bg-black hover:text-white transition">Upload banner</button>
            {bannerImagePreview && (
              <FilePreviewCard onRemove={clearBannerImage} ariaLabel="Remove banner" className="mt-2 inline-block">
                <img src={bannerImagePreview} alt="" className="h-24 w-24 object-cover" />
              </FilePreviewCard>
            )}
          </div>

          <div>
            <label className="block text-sm text-white mb-2">Cover video</label>
            <input type="file" ref={coverVideoInputRef} accept="video/*" className="hidden" onChange={handleCoverVideoChange} />
            <button type="button" onClick={() => coverVideoInputRef.current?.click()} className="px-5 py-2 bg-white border rounded-md text-black shadow-md hover:bg-black hover:text-white transition">Upload cover video</button>
            {coverVideo && coverVideoPreview && (
              <FilePreviewCard onRemove={clearCoverVideo} ariaLabel="Remove cover video" className="mt-2 block max-w-xs">
                <video src={coverVideoPreview} className="h-32 w-full object-cover" controls />
              </FilePreviewCard>
            )}
          </div>

          {/* walk through  */}

          <div>
            <label className="block text-sm text-white mb-2">Walk through video</label>
            <input type="file" ref={walkthroughVideoInputRef} accept="video/*" className="hidden" onChange={handleWalkthroughVideoChange} />
            <button type="button" onClick={onWalkthroughVideoButtonClick} className="px-5 py-2 bg-white border rounded-md text-black shadow-md hover:bg-black hover:text-white transition">Upload walk through video</button>
            {walkthroughVideoPreview && (
              <FilePreviewCard onRemove={clearWalkthroughVideo} ariaLabel="Remove walk through video" className="mt-2 block max-w-xs">
                <video src={walkthroughVideoPreview} className="h-32 w-full object-cover" controls />
              </FilePreviewCard>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm text-white">Gallery Images</label>
              <button type="button" onClick={onGalleryButtonClick} className="px-5 py-2 bg-white border rounded-md text-black shadow-md hover:bg-black hover:text-white transition">Add Images</button>
            </div>
            <input type="file" ref={galleryInputRef} accept="image/*" multiple className="hidden" onChange={handleGalleryChange} />
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {galleryImages.map((g) => (
                <div key={g.id} className="relative border border-gray-700 rounded-xl overflow-hidden bg-gray-800/70">
                  <img src={g.preview} alt={g.file.name} className="w-full h-24 object-cover" />
                  <button type="button" className="absolute top-1 right-1 bg-black/70 rounded-full p-1 text-red-400" onClick={() => removeGalleryImage(g.id)}>✕</button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm mb-2 text-white">Description </label>
            <textarea id="description" value={form.description}  rows={4} placeholder="Brief description"
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-md border border-gray-200 bg-gray-800 p-2 text-white focus:ring-2 focus:ring-indigo-500 min-h-[80px]" />
          </div>

          <div>
            <label className="block text-sm mb-2 text-white">Features</label>
            <div className="flex gap-3">
              <input value={featureInput} onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addFeature(); } }}
                placeholder="Type a feature and press Enter"
                className="flex-grow p-2 rounded-xl bg-gray-800 border border-black-200 text-white focus:ring-2 focus:ring-indigo-500" />
              <button type="button" onClick={addFeature} className="px-5 py-2 bg-white border rounded-md text-black shadow-md hover:bg-black hover:text-white transition">Add</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {features.map((f) => (
                <div key={f} className="bg-white text-black px-2 py-1 rounded-md flex items-center gap-2 text-sm">
                  <span>{f}</span>
                  <button type="button" onClick={() => removeFeature(f)} className="text-red-400 hover:text-red-600">✕</button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm text-white">RERA certificates</label>
              <button type="button" onClick={addReraCert} className="px-5 py-2 bg-white border rounded-md text-black shadow-md hover:bg-black hover:text-white transition">
                Add certificate
              </button>
            </div>
            <div className="space-y-4 mb-6">
              {reraCertificates.map((r) => (
                <div key={r.id} className="border border-gray-700 rounded-xl p-4 bg-gray-800/70 flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-sm mb-1 text-white">Title</label>
                    <input type="text" value={r.title} placeholder="Project, Tower A…" onChange={(e) => handleReraCertChange(r.id, "title", e.target.value)} className="w-full rounded-xl border border-gray-600 bg-gray-900 px-4 py-2 text-white" />
                  </div>
                  <input type="file" accept=".pdf,application/pdf,image/*" id={`rera-cert-${r.id}`} className="hidden" onChange={(e) => handleReraCertFile(r.id, e)} />
                  <button type="button" onClick={() => document.getElementById(`rera-cert-${r.id}`)?.click()} className="px-5 py-2 bg-white border rounded-md text-black">Upload</button>
                  {r.preview && <p className="text-sm text-gray-400 truncate max-w-[160px]">{r.file?.name}</p>}
                  <button type="button" onClick={() => removeReraCert(r.id)} className="px-4 py-2 bg-red-500 rounded-md text-white text-sm">Remove</button>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm text-white">RERA scanner images</label>
              <button type="button" onClick={addReraScanner} className="px-5 py-2 bg-white border rounded-md text-black shadow-md hover:bg-black hover:text-white transition">
                Add scanner image
              </button>
            </div>
            <div className="space-y-4 mb-6">
              {reraScannerImages.map((r) => (
                <div key={r.id} className="border border-gray-700 rounded-xl p-4 bg-gray-800/70 flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-sm mb-1 text-white">Title</label>
                    <input type="text" value={r.title} placeholder="Project, Tower A…" onChange={(e) => handleReraScannerChange(r.id, "title", e.target.value)} className="w-full rounded-xl border border-gray-600 bg-gray-900 px-4 py-2 text-white" />
                  </div>
                  <input type="file" accept="image/*" id={`rera-scan-${r.id}`} className="hidden" onChange={(e) => handleReraScannerFile(r.id, e)} />
                  <button type="button" onClick={() => document.getElementById(`rera-scan-${r.id}`)?.click()} className="px-5 py-2 bg-white border rounded-md text-black">Upload</button>
                  {r.preview && <img src={r.preview} alt="" className="h-16 w-16 object-cover rounded" />}
                  <button type="button" onClick={() => removeReraScanner(r.id)} className="px-4 py-2 bg-red-500 rounded-md text-white text-sm">Remove</button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-white mb-2">OC certificate</label>
              <input
                type="file"
                ref={ocCertInputRef}
                accept=".pdf,application/pdf,image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setOcCertificate(file);
                }}
              />
              <button
                type="button"
                onClick={() => ocCertInputRef.current?.click()}
                className="px-5 py-2 bg-white border rounded-md text-black shadow-md hover:bg-black hover:text-white transition"
              >
                Upload
              </button>
              {ocCertificate && (
                <FilePreviewCard
                  onRemove={clearOcCertificate}
                  ariaLabel="Remove OC certificate"
                  className="ml-2 inline-block max-w-[220px]"
                >
                  <p className="truncate px-3 py-2 text-sm text-gray-200">
                    {ocCertificate.name}
                  </p>
                </FilePreviewCard>
              )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm text-white">Brochures (PDF)</label>
              <button type="button" onClick={addBrowcherPdf} className="px-5 py-2 bg-white border rounded-md text-black shadow-md hover:bg-black hover:text-white transition">
                Add brochure
              </button>
            </div>
            <div className="space-y-4 mb-6">
              {browcherPdfs.map((b) => (
                <div key={b.id} className="border border-gray-700 rounded-xl p-4 bg-gray-800/70 flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-sm mb-1 text-white">Title</label>
                    <input type="text" value={b.title} placeholder="Phase 1, Tower A…" onChange={(e) => handleBrowcherPdfChange(b.id, "title", e.target.value)} className="w-full rounded-xl border border-gray-600 bg-gray-900 px-4 py-2 text-white" />
                  </div>
                  <input type="file" accept=".pdf,application/pdf" id={`browcher-pdf-${b.id}`} className="hidden" onChange={(e) => handleBrowcherPdfFile(b.id, e)} />
                  <button type="button" onClick={() => document.getElementById(`browcher-pdf-${b.id}`)?.click()} className="px-5 py-2 bg-white border rounded-md text-black">Upload PDF</button>
                  {b.preview && <p className="text-sm text-gray-400 truncate max-w-[160px]">{b.file?.name}</p>}
                  <button type="button" onClick={() => removeBrowcherPdf(b.id)} className="px-4 py-2 bg-red-500 rounded-md text-white text-sm">Remove</button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm text-white">
                Layouts{" "}
                <span className="text-gray-400 font-normal">
                  (title required; area e.g. 279 - 456, price & images optional)
                </span>
              </label>
              <button
                type="button"
                onClick={addLayout}
                className="px-5 py-2 bg-white border rounded-md text-black shadow-md hover:bg-black hover:text-white transition"
              >
                Add Layout
              </button>
            </div>
            <div className="space-y-6">
              {layouts.map((l) => (
                <div
                  key={l.id}
                  className="border border-gray-700 rounded-xl p-6 bg-gray-800/70"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                    <div>
                      <label className="block text-sm mb-1 text-white">Title</label>
                      <input
                        type="text"
                        value={l.title}
                        placeholder="e.g. 1 BHK, Studio, Penthouse"
                        onChange={(e) =>
                          handleLayoutChange(l.id, "title", e.target.value)
                        }
                        className="w-full rounded-xl border border-gray-600 bg-gray-900 px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1 text-white">Area (sq ft)</label>
                      <input
                        type="text"
                        value={l.area}
                        placeholder="e.g. 279 - 456"
                        onChange={(e) =>
                          handleLayoutChange(l.id, "area", e.target.value)
                        }
                        className="w-full rounded-xl border border-gray-600 bg-gray-900 px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1 text-white">Price (Lacs)</label>
                      <input
                        type="number"
                        value={l.price}
                        onChange={(e) =>
                          handleLayoutChange(l.id, "price", e.target.value)
                        }
                        className="w-full rounded-xl border border-gray-600 bg-gray-900 px-4 py-2 text-white focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      id={`layout-img-${l.id}`}
                      className="hidden"
                      onChange={(e) => handleLayoutImages(l.id, e)}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById(`layout-img-${l.id}`)?.click()
                      }
                      className="px-5 py-2 bg-white border rounded-md text-black shadow-md hover:bg-black hover:text-white transition"
                    >
                      Add Images{" "}
                      <span className="text-gray-500 font-normal">(optional, multiple)</span>
                    </button>
                  </div>
                  {(l.imageFiles || []).length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-3">
                      {(l.imageFiles || []).map((img) => (
                        <FilePreviewCard
                          key={img.id}
                          onRemove={() => removeLayoutImage(l.id, img.id)}
                          ariaLabel="Remove layout image"
                          className="inline-block"
                        >
                          <img
                            src={img.preview}
                            alt={l.title || "Layout"}
                            className="h-40 w-40 object-cover"
                          />
                        </FilePreviewCard>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeLayout(l.id)}
                    className="px-5 py-2 bg-red-500 border rounded-md text-black shadow-md hover:bg-black hover:text-white transition"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
          </fieldset>

          <div className="flex justify-end mt-8">
            <button
              type="submit"
              disabled={submitting}
              className="admin-btn-primary disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Add Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProject;
