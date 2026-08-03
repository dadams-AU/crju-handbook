-- The PDF template places the approved logo on the title page. Suppress the
-- duplicate source image that is retained for HTML and DOCX output.

local stringify = pandoc.utils.stringify

function Image(image)
  if image.classes:includes("web-docx-logo") then
    return {}
  end
end

local function is_roadmap_heading(title)
  return title:match("^SAMPLE COURSE MATRIX FOR STUDENTS")
      or title:match("^SAMPLE MATRIX FOR TRANSFER STUDENTS")
end

function Pandoc(doc)
  local output = pandoc.List()
  local in_roadmaps = false
  local blank_table_pending = false

  for _, block in ipairs(doc.blocks) do
    local title = (block.t == "Header" or block.t == "Para")
        and stringify(block.content) or ""

    if not in_roadmaps and block.t == "Header" and is_roadmap_heading(title) then
      output:insert(pandoc.RawBlock("latex", table.concat({
        "\\clearpage",
        "\\begin{landscape}",
        "\\footnotesize",
        "\\singlespacing",
        "\\setlength{\\parskip}{0.25\\baselineskip}",
        "\\setlength{\\tabcolsep}{3pt}"
      }, "\n")))
      in_roadmaps = true
    elseif in_roadmaps and block.t == "Header" and title == "CRIMINAL JUSTICE MINOR" then
      output:insert(pandoc.RawBlock("latex", table.concat({
        "\\clearpage",
        "\\end{landscape}",
        "\\normalsize",
        "\\onehalfspacing",
        "\\setlength{\\parskip}{0.5\\baselineskip}",
        "\\setlength{\\tabcolsep}{6pt}"
      }, "\n")))
      in_roadmaps = false
    elseif in_roadmaps and (
        (block.t == "Header" and (is_roadmap_heading(title) or title == "Blank Matrix for Planning Purposes"))
        or (block.t == "Para" and title == "Blank Matrix for Planning Purposes")) then
      output:insert(pandoc.RawBlock("latex", "\\clearpage"))
      blank_table_pending = title == "Blank Matrix for Planning Purposes"
    end

    if in_roadmaps and block.t == "Table" and blank_table_pending then
      output:insert(pandoc.RawBlock("latex", "\\setlength{\\extrarowheight}{0.42in}"))
      output:insert(block)
      output:insert(pandoc.RawBlock("latex", "\\setlength{\\extrarowheight}{0pt}"))
      blank_table_pending = false
    else
      output:insert(block)
    end
  end

  if in_roadmaps then
    output:insert(pandoc.RawBlock("latex", "\\clearpage\n\\end{landscape}\n\\normalsize\n\\onehalfspacing"))
  end

  doc.blocks = output
  return doc
end
