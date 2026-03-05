// Copyright (c) Said Borna. All rights reserved.
import { Search } from "lucide-react";
import { PagePlaceholder } from "@/components/common/page-placeholder";

export default function LeadExtractorPage() {
  return (
    <PagePlaceholder
      title="Lead Extractor"
      description="Extract leads from LinkedIn searches and posts — coming in Phase 4."
      icon={Search}
    />
  );
}
