#! /usr/bin/env lua

NEGATIVE = 1
POSITIVE = 2
ALL = 3

function init()
   local file, c, s, o, title, ofile

   if arg then
      local k=1
      local v=arg[k]
      while v do
	 if v == '-i' then
	    k = k + 1
	    file = arg[k]
	 end
	 if v == '-f' then
	    k = k + 1
	    file = arg[k]
	 end
	 if v == '-t' then
	    k = k + 1
	    title = arg[k]
	 end
	 if v == '-o' then
	    k = k + 1
	    ofile = arg[k]
	 end
	 if v == '-c' then
	    c = true
	 end
	 if v == '-n' then
	    o = NEGATIVE
	 end
	 if v == '-p' then
	    o = POSITIVE
	 end
	 if v == '-a' then
	    o = ALL
	 end
	 k = k + 1
	 v = arg[k]
      end
   end
   if c then
      s = create()
      if file then
	 save(file,s)
      end
   else
      s = process(file)
   end
   if o then
      doGraph(o,ofile,s,title)
   end
end

function doLine(line)
   local t,i,j,p = {}
   t.positives = {}
   t.negatives = {}
   i = line:find(";")
   t.name = line:sub(1,i-1)
   j = line:find(";",i+1)
   p = line:sub(i+1,j-1)
   if p ~= '' then
      local k,l = 1
      while p:find(",",k) do
	 l = p:find(",",k)
	 table.insert(t.positives,p:sub(k,l-1))
	 k = l+1
      end
      table.insert(t.positives,p:sub(k))
   end
   i = j
   p = line:sub(i+1)
   if p ~= '' then
      local k,l = 1
      while p:find(",",k) do
	 l = p:find(",",k)
	 table.insert(t.negatives,p:sub(k,l-1))
	 k = l+1
      end
      table.insert(t.negatives,p:sub(k))
   end
   return t
end

function process(file)
   local students = {}
   if file then
      local line
      io.input(file)
      line = io.read("*line")
      while line do
	 table.insert(students,doLine(line))
	 line = io.read("*line")
      end
   end
   return students
end

function create()
   local students,names,student,snames = {},{},''
   while student do
      student = getStudent()
      if student then
	 table.insert(students,student)
	 names[student.name] = true
	 for k,v in ipairs(student.positives) do
	    names[v] = true
	 end
	 for k,v in ipairs(student.negatives) do
	    names[v] = true
	 end
	 snames = {}
	 for v,_ in pairs(names) do
	    table.insert(snames,v)
	 end
	 table.sort(snames)
	 print("Students listed so far:",table.concat(snames,", "))
      end
   end
   return students
end

function save(file,students)
   io.output(file)
   table.sort(students, function(a,b) return a.name < b.name end)
   for _,v in ipairs(students) do
      io.write(v.name, ";", table.concat(v.positives,","), ";", table.concat(v.negatives,","),"\n")
   end
end

function getStudent()
   local t = {positives = {}, negatives = {}}
   print("Name:")
   local n
   repeat
      n = io.read("*line")
      if not n then
	 return nil
      end
   until n ~= ""
   t.name = n
   print("Positives:")
   local p = io.read("*line")
   while p ~= "" do
      table.insert(t.positives,p)
      p = io.read("*line")
   end
   print("Negatives:")
   p = io.read("*line")
   while p ~= "" do
      table.insert(t.negatives,p)
      p = io.read("*line")
   end
   return t
end

function doGraph(output,ofile,students,title)
   if ofile then
      io.output(ofile)
   end
   local dtitle
   if output == POSITIVE then
      dtitle = "Positive Sociogram"
   elseif output == NEGATIVE then
      dtitle = "Negative Sociogram"
   elseif output == ALL then
      dtitle = "Total Sociogram"
   else
      dtitle = "Sociogram"
   end
   title = title or dtitle
   io.write([[
strict digraph Class {
    splines=true;
    overlap=orthoyx;
    label="]]
       .. title ..
       [["
    labeloc=b;
    labeljust=center;
    fontsize=30;

  {
    node [style=filled];

]])
   local nodes,edges,names,ns = {},{},{},0
   
   for k,v in ipairs(students) do
      names[v.name] = k
      ns = ns + 1
   end

   for k,v in ipairs(students) do
      io.write("    STUDENT",k,' [label="',v.name,'"];',"\n")
   end

   io.write("\n}\n")
   
   local p = {}
   for k,v in ipairs(students) do
      p[k] = {}
      for l,u in ipairs(v.positives) do
	 p[k][names[u]] = true
      end
   end
   local n = {}
   for k,v in ipairs(students) do
      n[k] = {}
      for l,u in ipairs(v.negatives) do
	 n[k][names[u]] = true
      end
   end

   if output == POSITIVE or output == ALL then
      if output == ALL then
	 io.write("\n{\n    edge [color=\"red\"];\n")
      end	 
      io.write("\n{\n    edge [dir=\"both\"];\n")
      for k=1,ns-1 do
	 for l=k+1,ns do
	    if p[k][l] and p[l][k] then
	       io.write("    STUDENT",k," -> STUDENT",l,";\n")
	    end
	 end
      end
      io.write("}\n")
      for k=1,ns do
	 for l=1,ns do
	    if p[k][l] and not p[l][k] then
	       io.write("    STUDENT",k," -> STUDENT",l,";\n")
	    end
	 end
      end
      if output == ALL then
	 io.write("}\n")
      end
   end

   if output == NEGATIVE or output == ALL then
      if output == ALL then
	 io.write("\n{\n    edge [color=\"blue\"];\n")
      end	 
      io.write("\n{\n    edge [dir=\"both\"];\n")
      for k=1,ns-1 do
	 for l=k+1,ns do
	    if n[k][l] and n[l][k] then
	       io.write("    STUDENT",k," -> STUDENT",l,";\n")
	    end
	 end
      end
      io.write("}\n")
      for k=1,ns do
	 for l=1,ns do
	    if n[k][l] and not n[l][k] then
	       io.write("    STUDENT",k," -> STUDENT",l,";\n")
	    end
	 end
      end
      if output == ALL then
	 io.write("}\n")
      end
   end
   io.write([[
}
]])
end

init()