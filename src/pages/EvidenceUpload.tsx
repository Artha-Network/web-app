import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

/**
 * EvidenceUpload — redirects to the real EvidencePage (/evidence/:id).
 * Route: /upload?deal=<dealId>
 * Kept for backwards-compat with any old links.
 */
const EvidenceUpload: React.FC = () => {
  const [search] = useSearchParams();
  const dealId = search.get("deal");
  const navigate = useNavigate();

  useEffect(() => {
    if (dealId) {
      navigate(`/evidence/${dealId}`, { replace: true });
    } else {
      navigate("/deals", { replace: true });
    }
  }, [dealId, navigate]);

  return null;
};

export default EvidenceUpload;
