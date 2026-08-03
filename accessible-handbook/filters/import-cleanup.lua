-- Normalize the Fall 2026 handbook's Word structure during DOCX -> Markdown
-- import. This filter is deliberately conservative: it changes presentation
-- artifacts, not handbook wording.

local stringify = pandoc.utils.stringify

local function trim(value)
  return value:match("^%s*(.-)%s*$")
end

local function percent_decode(value)
  value = value:gsub("+", " ")
  return value:gsub("%%(%x%x)", function(hex)
    return string.char(tonumber(hex, 16))
  end)
end

local function strong_paragraph(content)
  return pandoc.Para({pandoc.Strong(content)})
end

function Link(link)
  -- Word preserved Outlook's tracking wrapper as the target. Recover the
  -- original URL so the source stays readable and durable.
  if link.target:match("safelinks%.protection%.outlook%.com") then
    local encoded = link.target:match("[?&]url=([^&]+)")
    if encoded then
      link.target = percent_decode(encoded)
    end
  end

  if link.target:match("^mailto:") then
    link.target = link.target:gsub("%%20", "")
    link.target = link.target:gsub("%?subject=$", "")

    -- A few faculty entries display one address but secretly link to another.
    -- For an email link, the address users can read is the least surprising
    -- and most accessible target. Also collapse the source's accidental @@.
    local visible = stringify(link.content):gsub("%s", ""):gsub("@@", "@")
    local email = visible:match("([%w._%%+%-]+@[%w.%-]+%.[A-Za-z]+)")
    if email then
      link.target = "mailto:" .. email
      link.content = pandoc.Inlines(email)
    end
  end

  return link
end

function Span(span)
  -- Underlining, highlighting, and small caps in the Word file are visual
  -- emphasis, not structural meaning. Preserve their text and nested strong
  -- or emphasis nodes without emitting format-specific spans.
  return span.content
end

function Underline(underline)
  return underline.content
end

function SmallCaps(smallcaps)
  return smallcaps.content
end

function BlockQuote(quote)
  -- Word uses indented/shaded paragraphs throughout for layout. They are not
  -- quotations, so flatten them to avoid false quote semantics.
  return quote.content
end

function Image(_)
  -- Imported images are duplicated logos, decorative clip art, blank shapes,
  -- and a stock photograph. The maintained, described logo is supplied by
  -- Markdown metadata instead.
  return {}
end

function OrderedList(list)
  -- Several Word lists retain stale numbering (for example, a one-item list
  -- beginning at 3). Let the Markdown source number each list consistently.
  list.start = 1
  return list
end

local paragraph_headings = {
  ["To track your progress in fulfilling the following requirements, access your Titan Degree Audit"] = true,
  ["Criminal Justice majors on academic notice have a hold placed by the College of Humanities and Social Sciences (HSS) and must attend an Academic Notice Information Session and be advised by a member of the HSS Student Success team (see below) to release this hold."] = true,
  ["The major now requires an additional 12 units of related fields credits. You may choose any courses from the list of approved courses."] = true,
}

local function normalize_header(header)
  local title = trim(stringify(header.content))

  if title == "" or title == "UNDERGRADUATE ADVISING FALL 2026" then
    return nil
  end

  if title:match("^Catalog Years Fall 2018 and later:") then
    return strong_paragraph(header.content)
  end

  if paragraph_headings[title]
      or #title > 150
      or title:match("^%d+ units of Criminal Justice courses")
      or title:match("^%d+ units per year")
      or title:match("^Please visit the Academic Advising Center")
      or title:match("^657%-278") then
    return strong_paragraph(header.content)
  end

  if title:match("^Try a minor in:") then
    return strong_paragraph(header.content)
  end

  if header.level > 3 then
    if title:match("^Interested in:") then
      header.level = 2
    else
      header.level = 2
    end
  end

  return header
end

function Pandoc(doc)
  local output = pandoc.List()
  local started = false
  local skipping_toc = false

  for _, block in ipairs(doc.blocks) do
    local title = block.t == "Header" and trim(stringify(block.content)) or ""

    -- Replace the layout-heavy cover with the metadata title block, but keep
    -- the complete welcome letter beginning at its salutation.
    if not started then
      if block.t == "Header" and title == "Welcome from the Department" then
        -- This is the maintained Markdown -> DOCX form returning from a
        -- faculty edit; its heading is already normalized.
        started = true
        output:insert(normalize_header(block))
      elseif block.t == "Header" and title == "Dear Criminal Justice Major," then
        -- This is the layout-heavy original Fall 2026 Word source.
        started = true
        output:insert(pandoc.Header(1, pandoc.Inlines("Welcome from the Department")))
        output:insert(pandoc.Para(block.content))
      end
    elseif block.t == "Header" and title == "Table of Contents" then
      skipping_toc = true
    elseif skipping_toc then
      if block.t == "Header" and title == "A SNAPSHOT OF SELECT CAREERS IN CRIMINAL JUSTICE" then
        skipping_toc = false
        local normalized = normalize_header(block)
        if normalized then output:insert(normalized) end
      end
    elseif block.t == "Header" then
      local normalized = normalize_header(block)
      if normalized then output:insert(normalized) end
    else
      output:insert(block)
    end
  end

  doc.blocks = output
  return doc
end
