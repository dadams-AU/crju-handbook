PANDOC ?= pandoc
PDF_ENGINE ?= lualatex
SOURCE := handbook.md
BUILD_DIR := build
FILTER := filters/import-cleanup.lua
PDF_TEMPLATE := templates/accessible-handbook.latex

.PHONY: all pdf docx html reimport check validate clean

all: pdf docx html check

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

pdf: $(BUILD_DIR)/crju-undergraduate-handbook-fa26.pdf

$(BUILD_DIR)/crju-undergraduate-handbook-fa26.pdf: $(SOURCE) $(PDF_TEMPLATE) filters/pdf-cleanup.lua | $(BUILD_DIR)
	$(PANDOC) $(SOURCE) \
		--from=markdown \
		--template=$(PDF_TEMPLATE) \
		--pdf-engine=$(PDF_ENGINE) \
		--lua-filter=filters/pdf-cleanup.lua \
		--toc --toc-depth=2 \
		--resource-path=.:.. \
		-o $@

docx: $(BUILD_DIR)/crju-undergraduate-handbook-fa26-editable.docx

$(BUILD_DIR)/crju-undergraduate-handbook-fa26-editable.docx: $(SOURCE) scripts/build_docx.py | $(BUILD_DIR)
	python3 scripts/build_docx.py --source=$(SOURCE) --output=$@ --pandoc=$(PANDOC)

html: $(BUILD_DIR)/crju-undergraduate-handbook-fa26.html

$(BUILD_DIR)/crju-undergraduate-handbook-fa26.html: $(SOURCE) styles/handbook.css | $(BUILD_DIR)
	$(PANDOC) $(SOURCE) \
		--from=markdown \
		--standalone --embed-resources \
		--shift-heading-level-by=1 \
		--include-before-body=includes/before-body.html \
		--include-after-body=includes/after-body.html \
		--toc --toc-depth=2 \
		--css=styles/handbook.css \
		--resource-path=.:.. \
		-o $@

# Safe re-import target for a future faculty-edited DOCX. It never overwrites
# handbook.md; review and merge build/reimported.md deliberately.
reimport: | $(BUILD_DIR)
	$(PANDOC) "$(DOCX_IN)" \
		--from=docx --to=markdown \
		--track-changes=accept --wrap=none \
		--lua-filter=$(FILTER) \
		-o $(BUILD_DIR)/reimported.md

check:
	@! rg -n 'safelinks\.protection\.outlook\.com|^#{4,} |^#\s*$$|!\[\]\(' $(SOURCE)
	@rg -q '^title:' $(SOURCE)
	@rg -q '^lang: en-US' $(SOURCE)
	@echo "Markdown structure checks passed."

validate: pdf check
	@command -v verapdf >/dev/null || { echo "veraPDF is required for PDF/UA validation." >&2; exit 1; }
	verapdf -f ua1 --format text --verbose $(BUILD_DIR)/crju-undergraduate-handbook-fa26.pdf

clean:
	rm -rf $(BUILD_DIR)
