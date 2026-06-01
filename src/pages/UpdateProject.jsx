import React, { useContext, useEffect, useRef, useState } from "react";
import { AppConetxt } from "../context/context";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { resolveAssetUrl } from "../utils/resolveAssetUrl";
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
  { value: "Residential & Commercial", label: "Residential & Commercial (both)" },
];

function layoutImagesFromRow(l) {
  if (Array.isArray(l?.images) && l.images.length) {
    return l.images.map((u) => String(u || "").trim()).filter(Boolean);
  }
  const single = String(l?.image || "").trim();
  return single ? [single] : [];
}

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

const UpdateProject = () => {
  const { allProjects, backendUrl, navigate } = useContext(AppConetxt);
  const { id } = useParams();
  const asset = (path) => resolveAssetUrl(path, backendUrl);

  const inputFeatureRef = useRef();
  const inputGalleryRef = useRef();
  const logoInputRef = useRef(null);
  const builderLogoInputRef = useRef(null);
  const coverImageInputRef = useRef(null);
  const bannerImageInputRef = useRef(null);
  const coverVideoInputRef = useRef(null);
  const walkthroughVideoInputRef = useRef(null);
  const ocCertInputRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [editableProject, setEditableProject] = useState(null);

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

  const [features, setFeatures] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [newGalleryImages, setNewGalleryImages] = useState([]);
  const [browcherPdfs, setBrowcherPdfs] = useState([]);
  const [newBrowcherPdfs, setNewBrowcherPdfs] = useState([]);

  const [layouts, setLayouts] = useState([]);
  const [newLayouts, setNewLayouts] = useState([]);
  const [plans, setPlans] = useState([]);

  const togglePlan = (plan) =>
    setPlans((prev) =>
      prev.includes(plan) ? prev.filter((p) => p !== plan) : [...prev, plan]
    );

  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoChanged, setLogoChanged] = useState(false);

  const [builderLogo, setBuilderLogo] = useState(null);
  const [builderLogoPreview, setBuilderLogoPreview] = useState(null);
  const [builderLogoChanged, setBuilderLogoChanged] = useState(false);

  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [coverImageChanged, setCoverImageChanged] = useState(false);

  const [bannerImage, setBannerImage] = useState(null);
  const [bannerImagePreview, setBannerImagePreview] = useState(null);
  const [bannerImageChanged, setBannerImageChanged] = useState(false);

  const [coverVideo, setCoverVideo] = useState(null);
  const [coverVideoPreview, setCoverVideoPreview] = useState(null);
  const [coverVideoChanged, setCoverVideoChanged] = useState(false);

  const [walkthroughVideo, setWalkthroughVideo] = useState(null);
  const [walkthroughVideoPreview, setWalkthroughVideoPreview] = useState(null);
  const [walkthroughVideoChanged, setWalkthroughVideoChanged] = useState(false);

  const [reraCertificates, setReraCertificates] = useState([]);
  const [newReraCertificates, setNewReraCertificates] = useState([]);
  const [reraScannerImages, setReraScannerImages] = useState([]);
  const [newReraScannerImages, setNewReraScannerImages] = useState([]);
  const [ocCertificate, setOcCertificate] = useState(null);
  const [ocCertificateChanged, setOcCertificateChanged] = useState(false);

  const loadTitledAssets = (val, urlKey) => {
    if (!val) return [];
    if (typeof val === "string" && val.trim()) {
      return [{ _id: "legacy", title: "Project", [urlKey]: val.trim() }];
    }
    return (Array.isArray(val) ? val : []).map((x, i) => ({
      _id: x._id || `existing-${urlKey}-${i}`,
      title: x.title || "",
      [urlKey]: x[urlKey] || x.file || x.image || "",
    }));
  };

  useEffect(() => {
    const found = allProjects?.find((p) => p._id === id);
    if (found) {
      setEditableProject(found);
      setForm({
        name: found.name || "",
        builder: found.builder || "",
        location: found.location || "",
        address: found.address || "",
        propertyType: found.propertyType || "",
        status: found.status || "Under Construction",
        contactNumber: (() => {
          let d = String(found.contactNumber || "").replace(/\D/g, "");
          if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
          if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
          return d.slice(0, 10);
        })(),
        latitude: found.latitude != null && found.latitude !== "" ? String(found.latitude) : "",
        longitude:
          found.longitude != null && found.longitude !== "" ? String(found.longitude) : "",
        description: found.description || "",
        reraNo: found.reraNo || "",
        reraMonth: found.reraPossession?.month || "",
        reraYear:
          found.reraPossession?.year != null
            ? String(found.reraPossession.year)
            : "",
        active: found.active !== false,
      });
      setFeatures(found.features || []);
      setPlans(Array.isArray(found.plans) ? [...found.plans] : []);
      setGalleryImages(found.galleryImages || []);
      setLayouts(
        (found.layouts || []).map((l) => ({
          ...l,
          area: l.area != null && l.area !== "" ? String(l.area) : "",
          images: layoutImagesFromRow(l),
          pendingFiles: [],
        }))
      );
      setNewGalleryImages([]);
      setNewLayouts([]);
      setBrowcherPdfs(loadTitledAssets(found.browcherPdf, "file"));
      setNewBrowcherPdfs([]);
      setLogo(found.logo || null);
      setBuilderLogo(found.builderLogo || null);
      setCoverImage(found.coverImage || null);
      setBannerImage(found.bannerImage || null);
      setCoverVideo(found.coverVideo || null);
      setWalkthroughVideo(found.walkthroughVideo || null);
      setLogoChanged(false);
      setBuilderLogoChanged(false);
      setCoverImageChanged(false);
      setBannerImageChanged(false);
      setCoverVideoChanged(false);
      setWalkthroughVideoChanged(false);
      setReraCertificates(loadTitledAssets(found.reraCertificate, "file"));
      setNewReraCertificates([]);
      setReraScannerImages(loadTitledAssets(found.reraScannerImage, "image"));
      setNewReraScannerImages([]);
      setOcCertificate(null);
      setOcCertificateChanged(false);
      setLogoPreview(null);
      setBuilderLogoPreview(null);
      setCoverImagePreview(null);
      setBannerImagePreview(null);
      setCoverVideoPreview(null);
      setWalkthroughVideoPreview(null);
    }
  }, [id, allProjects]);

  useEffect(() => {
    return () => {
      newGalleryImages.forEach((g) => URL.revokeObjectURL(g.preview));
      newReraCertificates.forEach((r) => r.preview && URL.revokeObjectURL(r.preview));
      newReraScannerImages.forEach((r) => r.preview && URL.revokeObjectURL(r.preview));
      newBrowcherPdfs.forEach((b) => b.preview && URL.revokeObjectURL(b.preview));
      newLayouts.forEach((l) =>
        (l.pendingFiles || []).forEach(
          (p) => p.preview && URL.revokeObjectURL(p.preview)
        )
      );
      layouts.forEach((l) =>
        (l.pendingFiles || []).forEach(
          (p) => p.preview && URL.revokeObjectURL(p.preview)
        )
      );
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      if (builderLogoPreview) URL.revokeObjectURL(builderLogoPreview);
      if (coverImagePreview) URL.revokeObjectURL(coverImagePreview);
      if (bannerImagePreview) URL.revokeObjectURL(bannerImagePreview);
      if (coverVideoPreview) URL.revokeObjectURL(coverVideoPreview);
      if (walkthroughVideoPreview) URL.revokeObjectURL(walkthroughVideoPreview);
    };
  }, [
    newGalleryImages,
    newReraCertificates,
    newReraScannerImages,
    newBrowcherPdfs,
    newLayouts,
    logoPreview,
    builderLogoPreview,
    coverImagePreview,
    bannerImagePreview,
    coverVideoPreview,
    walkthroughVideoPreview,
  ]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddFeature = () => {
    const text = inputFeatureRef.current?.value?.trim();
    if (text && !features.includes(text)) {
      setFeatures((prev) => [...prev, text]);
      inputFeatureRef.current.value = "";
    }
  };

  const removeFeature = (f) =>
    setFeatures((prev) => prev.filter((x) => x !== f));

  const onGalleryButtonClick = () => inputGalleryRef.current?.click();
  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newFiles = files.map((file, idx) => ({
      id: Date.now() + idx,
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewGalleryImages((prev) => [...prev, ...newFiles]);
  };
  const removeGalleryImage = (id) =>
    setGalleryImages((prev) => prev.filter((img) => img._id !== id));
  const removeNewGalleryImage = (id) => {
    const rem = newGalleryImages.find((g) => g.id === id);
    if (rem?.preview) URL.revokeObjectURL(rem.preview);
    setNewGalleryImages((prev) => prev.filter((img) => img.id !== id));
  };

  const onLogoButtonClick = () => logoInputRef.current?.click();
  const handleLogoChange = (e) => {
    setLogoChanged(true);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    const file = e.target.files?.[0];
    setLogo(file || null);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  };

  const onBuilderLogoButtonClick = () => builderLogoInputRef.current?.click();
  const handleBuilderLogoChange = (e) => {
    setBuilderLogoChanged(true);
    if (builderLogoPreview) URL.revokeObjectURL(builderLogoPreview);
    const file = e.target.files?.[0];
    setBuilderLogo(file || null);
    setBuilderLogoPreview(file ? URL.createObjectURL(file) : null);
  };

  const onCoverImageButtonClick = () => coverImageInputRef.current?.click();
  const handleCoverImageChange = (e) => {
    setCoverImageChanged(true);
    if (coverImagePreview) URL.revokeObjectURL(coverImagePreview);
    const file = e.target.files?.[0];
    setCoverImage(file || null);
    setCoverImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const onBannerImageButtonClick = () => bannerImageInputRef.current?.click();
  const handleBannerImageChange = (e) => {
    setBannerImageChanged(true);
    if (bannerImagePreview) URL.revokeObjectURL(bannerImagePreview);
    const file = e.target.files?.[0];
    setBannerImage(file || null);
    setBannerImagePreview(file ? URL.createObjectURL(file) : null);
    e.target.value = null;
  };

  const handleCoverVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverVideoChanged(true);
    if (coverVideoPreview) URL.revokeObjectURL(coverVideoPreview);
    setCoverVideo(file);
    setCoverVideoPreview(URL.createObjectURL(file));
    e.target.value = null;
  };

  const handleWalkthroughVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setWalkthroughVideoChanged(true);
    if (walkthroughVideoPreview) URL.revokeObjectURL(walkthroughVideoPreview);
    setWalkthroughVideo(file);
    setWalkthroughVideoPreview(URL.createObjectURL(file));
    e.target.value = null;
  };

  const addNewBrowcherPdf = () =>
    setNewBrowcherPdfs((prev) => [
      ...prev,
      { id: Date.now(), title: "", file: null, preview: null },
    ]);

  const addNewReraCert = () =>
    setNewReraCertificates((prev) => [
      ...prev,
      { id: Date.now(), title: "", file: null, preview: null },
    ]);
  const addNewReraScanner = () =>
    setNewReraScannerImages((prev) => [
      ...prev,
      { id: Date.now(), title: "", image: null, preview: null },
    ]);

  const handleOcCertChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcCertificate(file);
    setOcCertificateChanged(true);
    e.target.value = null;
  };

  const clearLogo = () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(null);
    if (logo instanceof File) {
      setLogo(editableProject?.logo ?? "");
      setLogoChanged(false);
    } else {
      setLogo("");
      setLogoChanged(true);
    }
    resetFileInput(logoInputRef);
  };

  const clearBuilderLogo = () => {
    if (builderLogoPreview) URL.revokeObjectURL(builderLogoPreview);
    setBuilderLogoPreview(null);
    if (builderLogo instanceof File) {
      setBuilderLogo(editableProject?.builderLogo ?? "");
      setBuilderLogoChanged(false);
    } else {
      setBuilderLogo("");
      setBuilderLogoChanged(true);
    }
    resetFileInput(builderLogoInputRef);
  };

  const clearCoverImage = () => {
    if (coverImagePreview) URL.revokeObjectURL(coverImagePreview);
    setCoverImagePreview(null);
    if (coverImage instanceof File) {
      setCoverImage(editableProject?.coverImage ?? null);
      setCoverImageChanged(false);
    } else {
      setCoverImage("");
      setCoverImageChanged(true);
    }
    resetFileInput(coverImageInputRef);
  };

  const clearBannerImage = () => {
    if (bannerImagePreview) URL.revokeObjectURL(bannerImagePreview);
    setBannerImagePreview(null);
    if (bannerImage instanceof File) {
      setBannerImage(editableProject?.bannerImage ?? "");
      setBannerImageChanged(false);
    } else {
      setBannerImage("");
      setBannerImageChanged(true);
    }
    resetFileInput(bannerImageInputRef);
  };

  const clearCoverVideo = () => {
    if (coverVideoPreview) URL.revokeObjectURL(coverVideoPreview);
    setCoverVideoPreview(null);
    if (coverVideo instanceof File) {
      setCoverVideo(editableProject?.coverVideo ?? "");
      setCoverVideoChanged(false);
    } else {
      setCoverVideo("");
      setCoverVideoChanged(true);
    }
    resetFileInput(coverVideoInputRef);
  };

  const clearWalkthroughVideo = () => {
    if (walkthroughVideoPreview) URL.revokeObjectURL(walkthroughVideoPreview);
    setWalkthroughVideoPreview(null);
    if (walkthroughVideo instanceof File) {
      setWalkthroughVideo(editableProject?.walkthroughVideo ?? "");
      setWalkthroughVideoChanged(false);
    } else {
      setWalkthroughVideo("");
      setWalkthroughVideoChanged(true);
    }
    resetFileInput(walkthroughVideoInputRef);
  };

  const clearOcCertificate = () => {
    if (ocCertificate instanceof File) {
      setOcCertificate(null);
      setOcCertificateChanged(false);
    } else {
      setOcCertificate("");
      setOcCertificateChanged(true);
    }
    resetFileInput(ocCertInputRef);
  };

  const removeLayoutStoredImage = (row, isNew, url) => {
    if (isNew) {
      setNewLayouts((prev) =>
        prev.map((l) =>
          l.id === row.id
            ? { ...l, images: (l.images || []).filter((u) => u !== url) }
            : l
        )
      );
    } else {
      setLayouts((prev) =>
        prev.map((l) =>
          l._id === row._id
            ? { ...l, images: (l.images || []).filter((u) => u !== url) }
            : l
        )
      );
    }
  };

  const removeLayoutPendingImage = (row, isNew, imageId) => {
    const patch = (l) => {
      if ((isNew ? l.id : l._id) !== (isNew ? row.id : row._id)) return l;
      const rem = (l.pendingFiles || []).find((p) => p.id === imageId);
      if (rem?.preview) URL.revokeObjectURL(rem.preview);
      return {
        ...l,
        pendingFiles: (l.pendingFiles || []).filter((p) => p.id !== imageId),
      };
    };
    if (isNew) setNewLayouts((prev) => prev.map(patch));
    else setLayouts((prev) => prev.map(patch));
  };

  const logoDisplaySrc = () => {
    if (logoChanged && logo instanceof File && logoPreview) return logoPreview;
    if (logoChanged && logo === "") return null;
    const path = logoChanged
      ? typeof logo === "string"
        ? logo
        : editableProject?.logo
      : logo || editableProject?.logo;
    return path ? asset(path) : null;
  };

  const builderLogoDisplaySrc = () => {
    if (builderLogoChanged && builderLogo instanceof File && builderLogoPreview)
      return builderLogoPreview;
    if (builderLogoChanged && builderLogo === "") return null;
    const path = builderLogoChanged
      ? typeof builderLogo === "string"
        ? builderLogo
        : editableProject?.builderLogo
      : builderLogo || editableProject?.builderLogo;
    return path ? asset(path) : null;
  };

  const coverImageDisplaySrc = () => {
    if (coverImageChanged && coverImage instanceof File && coverImagePreview)
      return coverImagePreview;
    if (coverImageChanged && coverImage === "") return null;
    const path = coverImageChanged
      ? typeof coverImage === "string"
        ? coverImage
        : editableProject?.coverImage
      : coverImage || editableProject?.coverImage;
    return path ? asset(path) : null;
  };

  const bannerImageDisplaySrc = () => {
    if (bannerImageChanged && bannerImage instanceof File && bannerImagePreview)
      return bannerImagePreview;
    if (bannerImageChanged && bannerImage === "") return null;
    const path = bannerImageChanged
      ? typeof bannerImage === "string"
        ? bannerImage
        : editableProject?.bannerImage
      : bannerImage || editableProject?.bannerImage;
    return path ? asset(path) : null;
  };

  const coverVideoDisplaySrc = () => {
    if (coverVideoChanged && coverVideo instanceof File && coverVideoPreview)
      return coverVideoPreview;
    if (coverVideoChanged && coverVideo === "") return null;
    const path = coverVideoChanged
      ? typeof coverVideo === "string"
        ? coverVideo
        : editableProject?.coverVideo
      : coverVideo || editableProject?.coverVideo;
    return path ? asset(path) : null;
  };

  const walkthroughVideoDisplaySrc = () => {
    if (
      walkthroughVideoChanged &&
      walkthroughVideo instanceof File &&
      walkthroughVideoPreview
    )
      return walkthroughVideoPreview;
    if (walkthroughVideoChanged && walkthroughVideo === "") return null;
    const path = walkthroughVideoChanged
      ? typeof walkthroughVideo === "string"
        ? walkthroughVideo
        : editableProject?.walkthroughVideo
      : walkthroughVideo || editableProject?.walkthroughVideo;
    return path ? asset(path) : null;
  };

  const ocDisplayName = () => {
    if (ocCertificateChanged && ocCertificate instanceof File)
      return ocCertificate.name;
    if (ocCertificateChanged && ocCertificate === "") return null;
    if (ocCertificateChanged) return null;
    return editableProject?.ocCertificate ? "Current file" : null;
  };

  const handleAddLayout = () => {
    setNewLayouts((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: "",
        area: "",
        price: "",
        images: [],
        pendingFiles: [],
      },
    ]);
  };

  const removeLayout = (lid) => {
    const rem = layouts.find((l) => l._id === lid);
    (rem?.pendingFiles || []).forEach(
      (p) => p.preview && URL.revokeObjectURL(p.preview)
    );
    setLayouts((prev) => prev.filter((l) => l._id !== lid));
  };
  const removeNewLayout = (lid) => {
    const rem = newLayouts.find((l) => l.id === lid);
    (rem?.pendingFiles || []).forEach(
      (p) => p.preview && URL.revokeObjectURL(p.preview)
    );
    setNewLayouts((prev) => prev.filter((l) => l.id !== lid));
  };

  const handleLayoutChange = (lid, e) => {
    const { name, value } = e.target;
    setLayouts((prev) =>
      prev.map((l) => (l._id === lid ? { ...l, [name]: value } : l))
    );
  };
  const handleNewLayoutChange = (lid, e) => {
    const { name, value } = e.target;
    setNewLayouts((prev) =>
      prev.map((l) => (l.id === lid ? { ...l, [name]: value } : l))
    );
  };

  const handleLayoutImagesAdd = (rowKey, isNew, e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const added = files.map((file, idx) => ({
      id: Date.now() + idx,
      file,
      preview: URL.createObjectURL(file),
    }));
    const patch = (l) => {
      const key = isNew ? l.id : l._id;
      if (key !== rowKey) return l;
      return { ...l, pendingFiles: [...(l.pendingFiles || []), ...added] };
    };
    if (isNew) setNewLayouts((prev) => prev.map(patch));
    else setLayouts((prev) => prev.map(patch));
    e.target.value = null;
  };

  const discard = () => navigate("/allProjects");

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Project name is required");
      return;
    }
    setSubmitting(true);
    try {
      const uploadEntries = [];
      newBrowcherPdfs
        .filter((b) => b.title?.trim() && b.file)
        .forEach((b) =>
          uploadEntries.push({ field: "newBrowcherPdfs", file: b.file })
        );
      if (logoChanged && logo instanceof File)
        uploadEntries.push({ field: "logo", file: logo });
      if (builderLogoChanged && builderLogo instanceof File)
        uploadEntries.push({ field: "builderLogo", file: builderLogo });
      if (coverImageChanged && coverImage instanceof File)
        uploadEntries.push({ field: "coverImage", file: coverImage });
      if (bannerImageChanged && bannerImage instanceof File)
        uploadEntries.push({ field: "bannerImage", file: bannerImage });
      if (coverVideoChanged && coverVideo instanceof File)
        uploadEntries.push({ field: "coverVideo", file: coverVideo });
      if (walkthroughVideoChanged && walkthroughVideo instanceof File)
        uploadEntries.push({ field: "walkthroughVideo", file: walkthroughVideo });
      newReraCertificates
        .filter((r) => r.title?.trim() && r.file)
        .forEach((r) =>
          uploadEntries.push({ field: "newReraCertificates", file: r.file })
        );
      newReraScannerImages
        .filter((r) => r.title?.trim() && r.image)
        .forEach((r) =>
          uploadEntries.push({ field: "newReraScannerImages", file: r.image })
        );
      if (ocCertificateChanged && ocCertificate instanceof File)
        uploadEntries.push({ field: "ocCertificate", file: ocCertificate });
      newGalleryImages.forEach((img) =>
        uploadEntries.push({ field: "galleryNewImages", file: img.file })
      );
      [...layouts, ...newLayouts].forEach((l) => {
        (l.pendingFiles || []).forEach((p) => {
          uploadEntries.push({ field: "newlayoutImages", file: p.file });
        });
      });

      const validUploadEntries = uploadEntries.filter((e) => e.file instanceof File);

      const uploaded =
        validUploadEntries.length > 0
          ? await uploadProjectFilesToS3(
              backendUrl,
              form.name.trim(),
              validUploadEntries
            )
          : [];

      const firstUrl = (field) =>
        uploaded.find((u) => u.field === field)?.publicUrl;

      const newGalleryPaths = uploaded
        .filter((u) => u.field === "galleryNewImages")
        .map((u) => ({
          title: galleryTitleFromFile(u.file),
          image: u.publicUrl,
        }));

      const completeNewBrowcherPdfs = newBrowcherPdfs.filter(
        (b) => b.title?.trim() && b.file
      );
      const newBrowcherPdfUrls = uploaded
        .filter((u) => u.field === "newBrowcherPdfs")
        .map((u) => u.publicUrl);
      const completeNewReraCerts = newReraCertificates.filter(
        (r) => r.title?.trim() && r.file
      );
      const newReraCertUrls = uploaded
        .filter((u) => u.field === "newReraCertificates")
        .map((u) => u.publicUrl);
      const completeNewScanners = newReraScannerImages.filter(
        (r) => r.title?.trim() && r.image
      );
      const newScannerUrls = uploaded
        .filter((u) => u.field === "newReraScannerImages")
        .map((u) => u.publicUrl);

      const newLayoutImageUrls = uploaded
        .filter((u) => u.field === "newlayoutImages")
        .map((u) => u.publicUrl);

      let newLayoutUrlIdx = 0;
      const mapLayoutRow = (l) => {
        const uploaded = (l.pendingFiles || []).map(
          () => newLayoutImageUrls[newLayoutUrlIdx++] || ""
        );
        const images = [...(l.images || []), ...uploaded].filter(Boolean);
        return {
          title: l.title,
          area: String(l.area ?? "").trim(),
          price: l.price,
          images,
          image: images[0] || "",
        };
      };
      const layoutsPayload = (layouts || []).map(mapLayoutRow);
      const newLayoutsPayload = (newLayouts || []).map(mapLayoutRow);

      const payload = {
        id,
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
        browcherPdfChanged: true,
        logoChanged,
        builderLogoChanged,
        coverImageChanged,
        bannerImageChanged,
        coverVideoChanged,
        walkthroughVideoChanged,
        reraCertificateChanged: true,
        reraScannerImageChanged: true,
        ocCertificateChanged,
        browcherPdf: (browcherPdfs || []).map((b) => ({
          title: b.title.trim(),
          file: b.file,
        })),
        newBrowcherPdfs: completeNewBrowcherPdfs.map((b, i) => ({
          title: b.title.trim(),
          file: newBrowcherPdfUrls[i],
        })),
        reraCertificate: (reraCertificates || []).map((r) => ({
          title: r.title.trim(),
          file: r.file,
        })),
        newReraCertificates: completeNewReraCerts.map((r, i) => ({
          title: r.title.trim(),
          file: newReraCertUrls[i],
        })),
        reraScannerImage: (reraScannerImages || []).map((r) => ({
          title: r.title.trim(),
          image: r.image,
        })),
        newReraScannerImages: completeNewScanners.map((r, i) => ({
          title: r.title.trim(),
          image: newScannerUrls[i],
        })),
        galleryImages: galleryImages || [],
        galleryNewImages: newGalleryPaths,
        layouts: layoutsPayload,
        newLayouts: newLayoutsPayload,
        active: form.active,
      };

      if (logoChanged)
        payload.logo =
          firstUrl("logo") || (typeof logo === "string" ? logo : "") || "";
      if (builderLogoChanged)
        payload.builderLogo =
          firstUrl("builderLogo") ||
          (typeof builderLogo === "string" ? builderLogo : "") ||
          "";
      if (coverImageChanged)
        payload.coverImage = firstUrl("coverImage") || coverImage;
      if (bannerImageChanged)
        payload.bannerImage = firstUrl("bannerImage") || bannerImage;
      if (coverVideoChanged)
        payload.coverVideo = firstUrl("coverVideo") || coverVideo;
      if (walkthroughVideoChanged)
        payload.walkthroughVideo =
          firstUrl("walkthroughVideo") || walkthroughVideo;
      if (ocCertificateChanged)
        payload.ocCertificate =
          firstUrl("ocCertificate") ||
          (typeof ocCertificate === "string" ? ocCertificate : "") ||
          "";

      const response = await axios.post(
        `${backendUrl}/api/project/updateProject`,
        payload,
        { timeout: 60_000 }
      );
      if (response.data.success) {
        toast.success("Project Updated Successfully", { autoClose: 2000 });
        navigate("/allprojects");
      } else {
        toast.error(response.data.message || "Update failed");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error updating project");
    } finally {
      setSubmitting(false);
    }
  };

  if (!editableProject)
    return <p className="text-center mt-4 text-gray-300">Loading project…</p>;

  return (
    <div className="admin-page">
      <div className="admin-form-card max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-center text-white">
          ✏️ Update Project
        </h1>

        <form onSubmit={handleSubmitForm} className="flex flex-col gap-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="mb-1 text-gray-200">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                required
                onChange={handleFormChange}
                className="p-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-gray-200">Builder</label>
              <input
                type="text"
                name="builder"
                value={form.builder}
                onChange={handleFormChange}
                className="p-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-col md:col-span-2">
              <label className="mb-1 text-gray-200">Location</label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleFormChange}
                className="p-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-col md:col-span-2">
              <label className="mb-1 text-gray-200">Full address</label>
              <textarea
                name="address"
                rows={2}
                value={form.address}
                placeholder="Dronagiri, Plot No. 84, Kaamtha Rd, Nr, Vimla Talao, New, Uran, Mumbai"
                onChange={handleFormChange}
                className="p-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 min-h-[72px]"
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-gray-200">Property type</label>
              <select
                name="propertyType"
                value={form.propertyType}
                onChange={handleFormChange}
                className="p-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-indigo-500"
              >
                {PROPERTY_TYPES.map(({ value, label }) => (
                  <option key={value || "none"} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-gray-200">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleFormChange}
                className="p-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-indigo-500"
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col md:col-span-2">
              <label className="mb-1 text-gray-200">Available plans</label>
              <p className="text-xs text-gray-400 mb-2">
                Configurations for filters and cards on the public site.
              </p>
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
            <div className="flex flex-col">
              <label className="mb-1 text-gray-200">Contact number</label>
              <input
                type="tel"
                name="contactNumber"
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
                className="p-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-col md:col-span-2">
              <label className="mb-2 flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleFormChange}
                  className="mt-1 h-4 w-4 rounded border-gray-500 text-indigo-500 focus:ring-indigo-500"
                />
                <span>
                  <span className="block text-gray-200 font-medium">Show on website</span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    Uncheck to hide from public listings and project pages.
                  </span>
                </span>
              </label>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-gray-200">
                Map latitude <span className="text-gray-500 text-xs">(optional)</span>
              </label>
              <input
                type="text"
                name="latitude"
                inputMode="decimal"
                placeholder="e.g. 19.2812"
                value={form.latitude}
                onChange={handleFormChange}
                className="p-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-gray-200">
                Map longitude <span className="text-gray-500 text-xs">(optional)</span>
              </label>
              <input
                type="text"
                name="longitude"
                inputMode="decimal"
                placeholder="e.g. 72.8574"
                value={form.longitude}
                onChange={handleFormChange}
                className="p-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex flex-col md:col-span-2">
              <label className="mb-1 text-gray-200">RERA number</label>
              <input
                type="text"
                name="reraNo"
                value={form.reraNo}
                placeholder="e.g. P51800012345"
                onChange={handleFormChange}
                className="p-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="mb-1 text-gray-200">RERA possession (month)</label>
              <select
                name="reraMonth"
                value={form.reraMonth}
                onChange={handleFormChange}
                className="p-2 rounded-lg bg-gray-800 border border-gray-600 text-white"
              >
                {MONTHS.map((m) => (
                  <option key={m || "none"} value={m}>
                    {m || "—"}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-gray-200">RERA possession (year)</label>
              <input
                type="number"
                name="reraYear"
                value={form.reraYear}
                onChange={handleFormChange}
                className="p-2 rounded-lg bg-gray-800 border border-gray-600 text-white"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-gray-200">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleFormChange}
              placeholder="Brief description"
              className="p-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                placeholder="Enter feature"
                ref={inputFeatureRef}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                className="flex-1 p-2 rounded-lg bg-gray-800 border border-gray-600 text-white"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-5 py-2 bg-white border rounded-md text-black shadow-md hover:bg-black hover:text-white transition"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {features.map((f, i) => (
                <span
                  key={i}
                  className="bg-white text-black px-2 py-1 rounded-md flex items-center gap-2 text-sm"
                >
                  {f}
                  <button
                    type="button"
                    onClick={() => removeFeature(f)}
                    className="text-red-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm text-white">Brochures (PDF)</label>
              <button type="button" onClick={addNewBrowcherPdf} className="px-5 py-2 bg-white border rounded-md text-black">Add brochure</button>
            </div>
            <div className="space-y-4 mb-6">
              {browcherPdfs.map((b) => (
                <div key={b._id} className="border border-gray-700 rounded-xl p-4 bg-gray-800/70 flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-sm mb-1 text-white">Title</label>
                    <input type="text" value={b.title} placeholder="Phase 1, Tower A…"
                      onChange={(e) => setBrowcherPdfs((prev) => prev.map((x) => x._id === b._id ? { ...x, title: e.target.value } : x))}
                      className="w-full rounded-xl border border-gray-600 bg-gray-900 px-4 py-2 text-white" />
                  </div>
                  {b.file && <p className="text-sm text-gray-400 truncate max-w-[200px]">{String(b.file).split("/").pop()}</p>}
                  <button type="button" onClick={() => setBrowcherPdfs((prev) => prev.filter((x) => x._id !== b._id))} className="px-4 py-2 bg-red-500 rounded-md text-white text-sm">Remove</button>
                </div>
              ))}
              {newBrowcherPdfs.map((b) => (
                <div key={b.id} className="border border-gray-700 rounded-xl p-4 bg-gray-800/70 flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-sm mb-1 text-white">Title</label>
                    <input type="text" value={b.title} placeholder="Phase 1, Tower A…"
                      onChange={(e) => setNewBrowcherPdfs((prev) => prev.map((x) => x.id === b.id ? { ...x, title: e.target.value } : x))}
                      className="w-full rounded-xl border border-gray-600 bg-gray-900 px-4 py-2 text-white" />
                  </div>
                  <input type="file" accept=".pdf,application/pdf" id={`new-browcher-pdf-${b.id}`} className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setNewBrowcherPdfs((prev) => prev.map((x) => {
                        if (x.id !== b.id) return x;
                        if (x.preview) URL.revokeObjectURL(x.preview);
                        return { ...x, file, preview: URL.createObjectURL(file) };
                      }));
                      e.target.value = null;
                    }} />
                  <button type="button" onClick={() => document.getElementById(`new-browcher-pdf-${b.id}`)?.click()} className="px-5 py-2 bg-white border rounded-md text-black">Upload PDF</button>
                  {b.preview && <p className="text-sm text-gray-400 truncate max-w-[160px]">{b.file?.name}</p>}
                  <button type="button" onClick={() => setNewBrowcherPdfs((prev) => { const rem = prev.find((x) => x.id === b.id); if (rem?.preview) URL.revokeObjectURL(rem.preview); return prev.filter((x) => x.id !== b.id); })} className="px-4 py-2 bg-red-500 rounded-md text-white text-sm">Remove</button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm text-white mb-2">Builder logo</label>
              <div className="flex items-center gap-4 flex-wrap">
                <input
                  type="file"
                  ref={builderLogoInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleBuilderLogoChange}
                />
                <button
                  type="button"
                  onClick={onBuilderLogoButtonClick}
                  className="px-5 py-2 bg-white border rounded-md text-black shadow-md hover:bg-black hover:text-white transition"
                >
                  {builderLogoDisplaySrc() ? "Replace builder logo" : "Upload builder logo"}
                </button>
                {builderLogoDisplaySrc() ? (
                  <FilePreviewCard onRemove={clearBuilderLogo} ariaLabel="Remove builder logo">
                    <img
                      src={builderLogoDisplaySrc()}
                      className="h-24 w-32 object-contain"
                      alt=""
                    />
                  </FilePreviewCard>
                ) : (
                  <p className="text-gray-500 text-sm">No builder logo</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm text-white mb-2">Project logo</label>
              <div className="flex items-center gap-4 flex-wrap">
                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
                <button
                  type="button"
                  onClick={onLogoButtonClick}
                  className="px-5 py-2 bg-white border rounded-md text-black shadow-md hover:bg-black hover:text-white transition"
                >
                  {logoDisplaySrc() ? "Replace project logo" : "Upload project logo"}
                </button>
                {logoDisplaySrc() ? (
                  <FilePreviewCard onRemove={clearLogo} ariaLabel="Remove project logo">
                    <img
                      src={logoDisplaySrc()}
                      className="h-24 w-32 object-contain"
                      alt=""
                    />
                  </FilePreviewCard>
                ) : (
                  <p className="text-gray-500 text-sm">No project logo</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-white mb-2">Cover image</label>
            <div className="flex items-center gap-4 flex-wrap">
              <input
                type="file"
                ref={coverImageInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleCoverImageChange}
              />
              <button
                type="button"
                onClick={onCoverImageButtonClick}
                className="px-5 py-2 bg-white border rounded-md text-black shadow-md hover:bg-black hover:text-white transition"
              >
                Replace cover
              </button>
              {coverImageDisplaySrc() ? (
                <FilePreviewCard
                  onRemove={clearCoverImage}
                  ariaLabel="Remove cover image"
                >
                  <img
                    src={coverImageDisplaySrc()}
                    className="h-24 w-32 object-cover"
                    alt=""
                  />
                </FilePreviewCard>
              ) : null}
            </div>
          </div>

          <div>
            <label className="block text-sm text-white mb-2">
              Banner image <span className="text-gray-400">(optional)</span>
            </label>
            <div className="flex items-center gap-4 flex-wrap">
              <input
                type="file"
                ref={bannerImageInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleBannerImageChange}
              />
              <button
                type="button"
                onClick={onBannerImageButtonClick}
                className="px-5 py-2 bg-white border rounded-md text-black shadow-md hover:bg-black hover:text-white transition"
              >
                Replace banner
              </button>
              {bannerImageDisplaySrc() ? (
                <FilePreviewCard
                  onRemove={clearBannerImage}
                  ariaLabel="Remove banner image"
                >
                  <img
                    src={bannerImageDisplaySrc()}
                    className="h-24 w-32 object-cover"
                    alt=""
                  />
                </FilePreviewCard>
              ) : (
                <p className="text-gray-500 text-sm">No banner image</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm text-white mb-2">Cover video</label>
            <input
              type="file"
              ref={coverVideoInputRef}
              accept="video/*"
              className="hidden"
              onChange={handleCoverVideoChange}
            />
            <button
              type="button"
              onClick={() => coverVideoInputRef.current?.click()}
              className="px-5 py-2 bg-white border rounded-md text-black shadow-md hover:bg-black hover:text-white transition"
            >
              Replace cover video
            </button>
            {coverVideoDisplaySrc() ? (
              <FilePreviewCard
                onRemove={clearCoverVideo}
                ariaLabel="Remove cover video"
                className="mt-2 block max-w-md"
              >
                <video
                  src={coverVideoDisplaySrc()}
                  className="h-32 w-full object-cover"
                  controls
                />
              </FilePreviewCard>
            ) : (
              <p className="text-gray-500 text-sm mt-1">No cover video</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-white mb-2">Walkthrough video</label>
            <input
              type="file"
              ref={walkthroughVideoInputRef}
              accept="video/*"
              className="hidden"
              onChange={handleWalkthroughVideoChange}
            />
            <button
              type="button"
              onClick={() => walkthroughVideoInputRef.current?.click()}
              className="px-5 py-2 bg-white border rounded-md text-black shadow-md hover:bg-black hover:text-white transition"
            >
              Replace walkthrough video
            </button>
            {walkthroughVideoDisplaySrc() ? (
              <FilePreviewCard
                onRemove={clearWalkthroughVideo}
                ariaLabel="Remove walkthrough video"
                className="mt-2 block max-w-md"
              >
                <video
                  src={walkthroughVideoDisplaySrc()}
                  className="h-32 w-full object-cover"
                  controls
                />
              </FilePreviewCard>
            ) : (
              <p className="text-gray-500 text-sm mt-1">No walkthrough video</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm text-white">RERA certificates</label>
              <button type="button" onClick={addNewReraCert} className="px-5 py-2 bg-white border rounded-md text-black">Add certificate</button>
            </div>
            <div className="space-y-4 mb-6">
              {reraCertificates.map((r) => (
                <div key={r._id} className="border border-gray-700 rounded-xl p-4 bg-gray-800/70 flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-sm mb-1 text-white">Title</label>
                    <input type="text" value={r.title} placeholder="Project, Tower A…"
                      onChange={(e) => setReraCertificates((prev) => prev.map((x) => x._id === r._id ? { ...x, title: e.target.value } : x))}
                      className="w-full rounded-xl border border-gray-600 bg-gray-900 px-4 py-2 text-white" />
                  </div>
                  <a href={asset(r.file)} target="_blank" rel="noreferrer" className="text-amber-400 text-sm hover:underline">View file</a>
                  <button type="button" onClick={() => setReraCertificates((prev) => prev.filter((x) => x._id !== r._id))} className="px-4 py-2 bg-red-500 rounded-md text-white text-sm">Remove</button>
                </div>
              ))}
              {newReraCertificates.map((r) => (
                <div key={r.id} className="border border-gray-700 rounded-xl p-4 bg-gray-800/70 flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-sm mb-1 text-white">Title (new)</label>
                    <input type="text" value={r.title} placeholder="Project, Tower A…"
                      onChange={(e) => setNewReraCertificates((prev) => prev.map((x) => x.id === r.id ? { ...x, title: e.target.value } : x))}
                      className="w-full rounded-xl border border-gray-600 bg-gray-900 px-4 py-2 text-white" />
                  </div>
                  <input type="file" accept=".pdf,application/pdf,image/*" id={`new-rera-cert-${r.id}`} className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setNewReraCertificates((prev) => prev.map((x) => {
                        if (x.id !== r.id) return x;
                        if (x.preview) URL.revokeObjectURL(x.preview);
                        return { ...x, file, preview: URL.createObjectURL(file) };
                      }));
                      e.target.value = "";
                    }} />
                  <button type="button" onClick={() => document.getElementById(`new-rera-cert-${r.id}`)?.click()} className="px-5 py-2 bg-white border rounded-md text-black">Upload</button>
                  {r.preview && <p className="text-sm text-gray-400">{r.file?.name}</p>}
                  <button type="button" onClick={() => setNewReraCertificates((prev) => { const rem = prev.find((x) => x.id === r.id); if (rem?.preview) URL.revokeObjectURL(rem.preview); return prev.filter((x) => x.id !== r.id); })} className="px-4 py-2 bg-red-500 rounded-md text-white text-sm">Remove</button>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm text-white">RERA scanner images</label>
              <button type="button" onClick={addNewReraScanner} className="px-5 py-2 bg-white border rounded-md text-black">Add scanner image</button>
            </div>
            <div className="space-y-4 mb-6">
              {reraScannerImages.map((r) => (
                <div key={r._id} className="border border-gray-700 rounded-xl p-4 bg-gray-800/70 flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-sm mb-1 text-white">Title</label>
                    <input type="text" value={r.title}
                      onChange={(e) => setReraScannerImages((prev) => prev.map((x) => x._id === r._id ? { ...x, title: e.target.value } : x))}
                      className="w-full rounded-xl border border-gray-600 bg-gray-900 px-4 py-2 text-white" />
                  </div>
                  <img src={asset(r.image)} alt="" className="h-16 w-16 object-cover rounded" />
                  <button type="button" onClick={() => setReraScannerImages((prev) => prev.filter((x) => x._id !== r._id))} className="px-4 py-2 bg-red-500 rounded-md text-white text-sm">Remove</button>
                </div>
              ))}
              {newReraScannerImages.map((r) => (
                <div key={r.id} className="border border-gray-700 rounded-xl p-4 bg-gray-800/70 flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-sm mb-1 text-white">Title (new)</label>
                    <input type="text" value={r.title}
                      onChange={(e) => setNewReraScannerImages((prev) => prev.map((x) => x.id === r.id ? { ...x, title: e.target.value } : x))}
                      className="w-full rounded-xl border border-gray-600 bg-gray-900 px-4 py-2 text-white" />
                  </div>
                  <input type="file" accept="image/*" id={`new-rera-scan-${r.id}`} className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setNewReraScannerImages((prev) => prev.map((x) => {
                        if (x.id !== r.id) return x;
                        if (x.preview) URL.revokeObjectURL(x.preview);
                        return { ...x, image: file, preview: URL.createObjectURL(file) };
                      }));
                      e.target.value = "";
                    }} />
                  <button type="button" onClick={() => document.getElementById(`new-rera-scan-${r.id}`)?.click()} className="px-5 py-2 bg-white border rounded-md text-black">Upload</button>
                  {r.preview && <img src={r.preview} alt="" className="h-16 w-16 object-cover rounded" />}
                  <button type="button" onClick={() => setNewReraScannerImages((prev) => { const rem = prev.find((x) => x.id === r.id); if (rem?.preview) URL.revokeObjectURL(rem.preview); return prev.filter((x) => x.id !== r.id); })} className="px-4 py-2 bg-red-500 rounded-md text-white text-sm">Remove</button>
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
                onChange={handleOcCertChange}
              />
              <button
                type="button"
                onClick={() => ocCertInputRef.current?.click()}
                className="px-5 py-2 bg-white border rounded-md text-black shadow-md hover:bg-black hover:text-white transition"
              >
                Upload new
              </button>
              {ocDisplayName() && (
                <FilePreviewCard
                  onRemove={clearOcCertificate}
                  ariaLabel="Remove OC certificate"
                  className="mt-2 inline-block max-w-[220px]"
                >
                  {ocCertificateChanged && ocCertificate instanceof File ? (
                    <p className="truncate px-3 py-2 text-sm text-gray-200">
                      {ocCertificate.name}
                    </p>
                  ) : (
                    <a
                      href={asset(editableProject.ocCertificate)}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate px-3 py-2 text-sm text-amber-400 hover:underline"
                    >
                      Current file
                    </a>
                  )}
                </FilePreviewCard>
              )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-gray-200">Gallery</label>
              <div>
                <input
                  ref={inputGalleryRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleGalleryChange}
                />
                <button
                  type="button"
                  onClick={onGalleryButtonClick}
                  className="px-5 py-2 bg-white border rounded-md text-black shadow-md hover:bg-black hover:text-white transition"
                >
                  Add images
                </button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {galleryImages.map((img) => (
                <div
                  key={img._id}
                  className="relative border border-gray-700 rounded-xl overflow-hidden"
                >
                  <img
                    src={asset(img.image)}
                    alt={img.title}
                    className="w-full h-24 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(img._id)}
                    className="absolute top-1 right-1 bg-black/70 rounded-full p-1 text-red-400"
                  >
                    X
                  </button>
                </div>
              ))}
              {newGalleryImages.map((img) => (
                <div key={img.id} className="relative border border-gray-700 rounded-xl overflow-hidden">
                  <img src={img.preview} alt="" className="w-full h-24 object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewGalleryImage(img.id)}
                    className="absolute top-1 right-1 bg-black/70 rounded-full p-1 text-red-400"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm text-white">
                Layouts{" "}
                <span className="text-gray-400 font-normal">
                  (title required; area e.g. 279 - 456, price & images optional)
                </span>
              </label>
              <button
                type="button"
                onClick={handleAddLayout}
                className="px-5 py-2 bg-white border rounded-md text-black shadow-md hover:bg-black hover:text-white transition"
              >
                Add layout
              </button>
            </div>

            {[...layouts, ...newLayouts].map((l) => {
              const isNew = newLayouts.some((nl) => nl.id === l.id);
              const rowKey = isNew ? l.id : l._id;
              return (
                <div
                  key={rowKey}
                  className="border border-gray-700 rounded-xl p-6 bg-gray-800/70"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                    <div>
                      <label className="block text-sm mb-1 text-white">Title</label>
                      <input
                        type="text"
                        value={l.title}
                        name="title"
                        placeholder="e.g. 1 BHK, Studio, Penthouse"
                        onChange={
                          isNew
                            ? (e) => handleNewLayoutChange(l.id, e)
                            : (e) => handleLayoutChange(l._id, e)
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
                        name="area"
                        onChange={
                          isNew
                            ? (e) => handleNewLayoutChange(l.id, e)
                            : (e) => handleLayoutChange(l._id, e)
                        }
                        className="w-full rounded-xl border border-gray-600 bg-gray-900 px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1 text-white">Price</label>
                      <input
                        type="number"
                        value={l.price}
                        name="price"
                        onChange={
                          isNew
                            ? (e) => handleNewLayoutChange(l.id, e)
                            : (e) => handleLayoutChange(l._id, e)
                        }
                        className="w-full rounded-xl border border-gray-600 bg-gray-900 px-4 py-2 text-white"
                      />
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    id={`layoutInput-${rowKey}`}
                    onChange={(e) =>
                      handleLayoutImagesAdd(isNew ? l.id : l._id, isNew, e)
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById(`layoutInput-${rowKey}`).click()
                    }
                    className="px-5 py-2 bg-white border rounded-md text-black mb-2"
                  >
                    Add images{" "}
                    <span className="text-gray-500 font-normal">(optional, multiple)</span>
                  </button>
                  <div className="mb-2 flex flex-wrap gap-3">
                    {(l.images || []).map((url) => (
                      <FilePreviewCard
                        key={url}
                        onRemove={() => removeLayoutStoredImage(l, isNew, url)}
                        ariaLabel="Remove layout image"
                        className="inline-block"
                      >
                        <img
                          src={asset(url)}
                          alt=""
                          className="h-40 w-40 object-cover"
                        />
                      </FilePreviewCard>
                    ))}
                    {(l.pendingFiles || []).map((p) => (
                      <FilePreviewCard
                        key={p.id}
                        onRemove={() => removeLayoutPendingImage(l, isNew, p.id)}
                        ariaLabel="Remove layout image"
                        className="inline-block"
                      >
                        <img
                          src={p.preview}
                          alt=""
                          className="h-40 w-40 object-cover"
                        />
                      </FilePreviewCard>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={
                      isNew
                        ? () => removeNewLayout(l.id)
                        : () => removeLayout(l._id)
                    }
                    className="px-5 py-2 bg-red-500 border rounded-md text-black"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={discard}
              className="px-5 py-2 bg-red-500 border rounded-md text-black"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-yellow-200 border rounded-md text-black"
            >
              {submitting ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateProject;
