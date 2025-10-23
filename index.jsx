import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, AlertCircle, CheckCircle, BarChart3, Settings, RefreshCw, Play } from 'lucide-react';

class Graph {
  constructor(n) {
    this.n = n;
    this.adj = Array(n).fill(0).map(() => []);
    this.degree = Array(n).fill(0);
  }
  
  addEdge(u, v) {
    if (u !== v && !this.adj[u].includes(v)) {
      this.adj[u].push(v);
      this.adj[v].push(u);
      this.degree[u]++;
      this.degree[v]++;
    }
  }
  
  maxDegree() {
    return Math.max(...this.degree, 0);
  }
}

function dsaturColoring(graph, courses, numSlots) {
  const n = courses.length;
  const colors = Array(n).fill(-1);
  const saturation = Array(n).fill(0);
  const adjacentColors = Array(n).fill(0).map(() => new Set());
  
  let maxDegreeVertex = 0;
  for (let i = 1; i < n; i++) {
    if (graph.degree[i] > graph.degree[maxDegreeVertex]) {
      maxDegreeVertex = i;
    }
  }
  
  const allowedSlots = courses[maxDegreeVertex].allowedSlots;
  if (allowedSlots && allowedSlots.length > 0) {
    colors[maxDegreeVertex] = allowedSlots[0];
  } else {
    colors[maxDegreeVertex] = 0;
  }
  
  for (let adj of graph.adj[maxDegreeVertex]) {
    adjacentColors[adj].add(colors[maxDegreeVertex]);
    saturation[adj]++;
  }
  
  let colored = 1;
  
  while (colored < n) {
    let maxSat = -1;
    let maxDeg = -1;
    let selected = -1;
    
    for (let v = 0; v < n; v++) {
      if (colors[v] === -1) {
        if (saturation[v] > maxSat || (saturation[v] === maxSat && graph.degree[v] > maxDeg)) {
          maxSat = saturation[v];
          maxDeg = graph.degree[v];
          selected = v;
        }
      }
    }
    
    if (selected === -1) break;
    
    const allowedSlots = courses[selected].allowedSlots;
    let assignedColor = -1;
    
    if (allowedSlots && allowedSlots.length > 0) {
      for (let slot of allowedSlots) {
        if (!adjacentColors[selected].has(slot)) {
          assignedColor = slot;
          break;
        }
      }
      if (assignedColor === -1) return null;
    } else {
      for (let c = 0; c < numSlots; c++) {
        if (!adjacentColors[selected].has(c)) {
          assignedColor = c;
          break;
        }
      }
    }
    
    if (assignedColor === -1) return null;
    
    colors[selected] = assignedColor;
    colored++;
    
    for (let adj of graph.adj[selected]) {
      if (colors[adj] === -1) {
        const oldSize = adjacentColors[adj].size;
        adjacentColors[adj].add(assignedColor);
        if (adjacentColors[adj].size > oldSize) {
          saturation[adj]++;
        }
      }
    }
  }
  
  return colors;
}

function bipartiteMatching(courses, rooms) {
  const matching = {};
  const used = new Set();
  
  function dfs(course, visited) {
    for (let room of rooms) {
      if (visited.has(room.id)) continue;
      
      const fits = course.enrollment <= room.capacity;
      const hasEquipment = course.equipment.every(e => room.equipment.includes(e));
      
      if (fits && hasEquipment) {
        visited.add(room.id);
        
        if (!used.has(room.id) || dfs(matching[room.id], visited)) {
          matching[room.id] = course;
          return true;
        }
      }
    }
    return false;
  }
  
  const assignments = {};
  for (let course of courses) {
    const visited = new Set();
    if (dfs(course, visited)) {
      for (let [roomId, assignedCourse] of Object.entries(matching)) {
        if (assignedCourse === course) {
          assignments[course.id] = roomId;
          used.add(roomId);
          break;
        }
      }
    }
  }
  
  return assignments;
}

export default function TimetableGenerator() {
  const [activeTab, setActiveTab] = useState('setup');
  const [numCourses, setNumCourses] = useState(15);
  const [numStudents, setNumStudents] = useState(100);
  const [numSlots, setNumSlots] = useState(10);
  
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [graph, setGraph] = useState(null);
  const [solution, setSolution] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);
  
  const timeSlotNames = [
    'Mon 9-10', 'Mon 10-11', 'Mon 11-12', 'Mon 2-3', 'Mon 3-4',
    'Tue 9-10', 'Tue 10-11', 'Tue 11-12', 'Tue 2-3', 'Tue 3-4',
    'Wed 9-10', 'Wed 10-11', 'Wed 11-12', 'Wed 2-3', 'Wed 3-4',
    'Thu 9-10', 'Thu 10-11', 'Thu 11-12', 'Thu 2-3', 'Thu 3-4',
    'Fri 9-10', 'Fri 10-11', 'Fri 11-12', 'Fri 2-3', 'Fri 3-4'
  ];
  
  const generateData = () => {
    setError(null);
    const newCourses = [];
    const equipment = ['Projector', 'Whiteboard', 'Lab', 'Computer'];
    
    for (let i = 0; i < numCourses; i++) {
      const enrollment = 20 + Math.floor(Math.random() * 80);
      const numEquip = Math.random() < 0.3 ? 1 : 0;
      const courseEquip = numEquip > 0 ? [equipment[Math.floor(Math.random() * equipment.length)]] : [];
      
      let allowedSlots = null;
      if (Math.random() < 0.3) {
        const numAllowed = 3 + Math.floor(Math.random() * 5);
        allowedSlots = [];
        while (allowedSlots.length < numAllowed) {
          const slot = Math.floor(Math.random() * numSlots);
          if (!allowedSlots.includes(slot)) allowedSlots.push(slot);
        }
        allowedSlots.sort((a, b) => a - b);
      }
      
      newCourses.push({
        id: CS${100 + i},
        name: Course ${i + 1},
        enrollment,
        equipment: courseEquip,
        allowedSlots,
        instructor: Prof. ${String.fromCharCode(65 + (i % 26))}
      });
    }
    
    const newStudents = [];
    for (let i = 0; i < numStudents; i++) {
      const numEnrolled = 3 + Math.floor(Math.random() * 3);
      const enrolled = [];
      while (enrolled.length < numEnrolled) {
        const courseIdx = Math.floor(Math.random() * numCourses);
        if (!enrolled.includes(courseIdx)) {
          enrolled.push(courseIdx);
        }
      }
      newStudents.push({
        id: S${1000 + i},
        courses: enrolled
      });
    }
    
    const newRooms = [
      { id: 'R101', capacity: 30, equipment: ['Projector', 'Whiteboard'] },
      { id: 'R102', capacity: 50, equipment: ['Projector', 'Whiteboard'] },
      { id: 'R103', capacity: 80, equipment: ['Projector', 'Whiteboard'] },
      { id: 'R104', capacity: 100, equipment: ['Projector', 'Whiteboard'] },
      { id: 'Lab1', capacity: 40, equipment: ['Projector', 'Computer', 'Lab'] },
      { id: 'Lab2', capacity: 30, equipment: ['Projector', 'Computer', 'Lab'] },
      { id: 'R201', capacity: 40, equipment: ['Projector', 'Whiteboard'] },
      { id: 'R202', capacity: 60, equipment: ['Projector', 'Whiteboard'] },
    ];
    
    const g = new Graph(numCourses);
    for (let student of newStudents) {
      for (let i = 0; i < student.courses.length; i++) {
        for (let j = i + 1; j < student.courses.length; j++) {
          g.addEdge(student.courses[i], student.courses[j]);
        }
      }
    }
    
    setCourses(newCourses);
    setStudents(newStudents);
    setRooms(newRooms);
    setGraph(g);
    setSolution(null);
    setMetrics(null);
  };
  
  const solveTimetable = () => {
    if (!graph || courses.length === 0) return;
    
    setError(null);
    const startTime = performance.now();
    
    const coloring = dsaturColoring(graph, courses, numSlots);
    
    if (!coloring) {
      setError('No valid timetable found! Try increasing the number of time slots.');
      return;
    }
    
    const slotAssignments = {};
    for (let i = 0; i < numSlots; i++) {
      slotAssignments[i] = [];
    }
    
    for (let i = 0; i < courses.length; i++) {
      if (coloring[i] !== -1) {
        slotAssignments[coloring[i]].push(courses[i]);
      }
    }
    
    const roomAssignments = {};
    let unassignedCourses = 0;
    
    for (let slot = 0; slot < numSlots; slot++) {
      const coursesInSlot = slotAssignments[slot];
      if (coursesInSlot.length > 0) {
        const matching = bipartiteMatching(coursesInSlot, rooms);
        roomAssignments[slot] = matching;
        unassignedCourses += coursesInSlot.length - Object.keys(matching).length;
      }
    }
    
    const endTime = performance.now();
    
    const usedSlots = Object.keys(slotAssignments).filter(s => slotAssignments[s].length > 0).length;
    const slotSizes = Object.values(slotAssignments).map(s => s.length);
    const maxSlotSize = Math.max(...slotSizes);
    const minSlotSize = Math.min(...slotSizes.filter(s => s > 0));
    const avgSlotSize = slotSizes.reduce((a, b) => a + b, 0) / usedSlots;
    const imbalance = maxSlotSize - minSlotSize;
    
    const delta = graph.maxDegree();
    
    let totalCapacity = 0;
    let usedCapacity = 0;
    for (let slot in roomAssignments) {
      for (let courseId in roomAssignments[slot]) {
        const roomId = roomAssignments[slot][courseId];
        const room = rooms.find(r => r.id === roomId);
        const course = courses.find(c => c.id === courseId);
        if (room && course) {
          totalCapacity += room.capacity;
          usedCapacity += course.enrollment;
        }
      }
    }
    const roomUtilization = totalCapacity > 0 ? (usedCapacity / totalCapacity * 100).toFixed(1) : 0;
    
    setMetrics({
      slotsUsed: usedSlots,
      delta,
      maxSlotSize,
      minSlotSize,
      avgSlotSize: avgSlotSize.toFixed(1),
      imbalance,
      unassignedCourses,
      roomUtilization,
      computeTime: (endTime - startTime).toFixed(2)
    });
    
    setSolution({ coloring, slotAssignments, roomAssignments });
    setActiveTab('timetable');
  };
  
  useEffect(() => {
    generateData();
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 mb-6 border border-white/20">
          <div className="flex items-center gap-4 mb-3">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                Timetable Generator
              </h1>
              <p className="text-purple-200 text-sm">Graph Theory Powered Scheduling</p>
            </div>
          </div>
          <div className="flex gap-2 text-xs text-purple-300">
            <span className="bg-purple-500/30 px-3 py-1 rounded-full">Hajnal-Szemerédi</span>
            <span className="bg-purple-500/30 px-3 py-1 rounded-full">Brooks' Theorem</span>
            <span className="bg-purple-500/30 px-3 py-1 rounded-full">Hall's Marriage</span>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="flex border-b border-white/20">
            {['setup', 'timetable', 'analysis'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-6 py-4 font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-purple-500 text-white'
                    : 'text-purple-200 hover:bg-white/5'
                }`}
              >
                {tab === 'setup' && <Settings className="w-4 h-4 inline mr-2" />}
                {tab === 'timetable' && <Calendar className="w-4 h-4 inline mr-2" />}
                {tab === 'analysis' && <BarChart3 className="w-4 h-4 inline mr-2" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="p-6">
            {activeTab === 'setup' && (
              <div className="space-y-6">
                {error && (
                  <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-200">
                    <AlertCircle className="w-5 h-5 inline mr-2" />
                    {error}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-purple-200 mb-2">
                      Number of Courses
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={numCourses}
                      onChange={(e) => setNumCourses(parseInt(e.target.value))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-purple-200 mb-2">
                      Number of Students
                    </label>
                    <input
                      type="number"
                      min="20"
                      max="500"
                      value={numStudents}
                      onChange={(e) => setNumStudents(parseInt(e.target.value))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-purple-200 mb-2">
                      Available Time Slots
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="25"
                      value={numSlots}
                      onChange={(e) => setNumSlots(parseInt(e.target.value))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={generateData}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all flex items-center gap-2 border border-white/30"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Generate New Data
                  </button>
                  <button
                    onClick={solveTimetable}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg"
                  >
                    <Play className="w-5 h-5" />
                    Generate Timetable
                  </button>
                </div>
                
                {graph && (
                  <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-6 border border-white/20">
                    <h3 className="font-bold text-white text-lg mb-4">Dataset Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="bg-white/10 rounded-lg p-4">
                        <div className="text-purple-300 text-xs mb-1">Courses</div>
                        <div className="text-white text-2xl font-bold">{courses.length}</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-4">
                        <div className="text-purple-300 text-xs mb-1">Students</div>
                        <div className="text-white text-2xl font-bold">{students.length}</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-4">
                        <div className="text-purple-300 text-xs mb-1">Rooms</div>
                        <div className="text-white text-2xl font-bold">{rooms.length}</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-4">
                        <div className="text-purple-300 text-xs mb-1">Max Degree (Δ)</div>
                        <div className="text-white text-2xl font-bold">{graph.maxDegree()}</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-4">
                        <div className="text-purple-300 text-xs mb-1">Conflicts</div>
                        <div className="text-white text-2xl font-bold">
                          {graph.adj.reduce((sum, adj) => sum + adj.length, 0) / 2}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'timetable' && solution && (
              <div className="space-y-4">
                {Object.entries(solution.slotAssignments)
                  .filter(([_, courses]) => courses.length > 0)
                  .map(([slot, coursesInSlot]) => (
                    <div key={slot} className="bg-white/5 border border-white/20 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-xl text-white flex items-center gap-3">
                          <Clock className="w-6 h-6 text-purple-400" />
                          {timeSlotNames[slot] || Slot ${parseInt(slot) + 1}}
                        </h3>
                        <span className="bg-purple-500/30 text-purple-200 px-4 py-1 rounded-full text-sm font-semibold">
                          {coursesInSlot.length} courses
                        </span>
                      </div>
                      <div className="space-y-3">
                        {coursesInSlot.map(course => {
                          const roomId = solution.roomAssignments[slot]?.[course.id];
                          const room = rooms.find(r => r.id === roomId);
                          return (
                            <div key={course.id} className="bg-white/10 rounded-lg p-4 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-mono font-bold text-sm">
                                  {course.id}
                                </div>
                                <div>
                                  <div className="font-semibold text-white text-lg">{course.name}</div>
                                  <div className="text-purple-300 text-sm">
                                    {course.instructor} • {course.enrollment} students
                                    {course.equipment.length > 0 && ` • ${course.equipment.join(', ')}`}
                                  </div>
                                </div>
                              </div>
                              <div>
                                {room ? (
                                  <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/50 px-4 py-2 rounded-lg">
                                    <MapPin className="w-4 h-4 text-green-400" />
                                    <span className="font-bold text-green-300">{room.id}</span>
                                    <span className="text-green-400 text-xs">({room.capacity})</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 px-4 py-2 rounded-lg">
                                    <AlertCircle className="w-4 h-4 text-red-400" />
                                    <span className="font-bold text-red-300">No Room</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
            
            {activeTab === 'timetable' && !solution && (
              <div className="text-center py-20">
                <Calendar className="w-20 h-20 mx-auto mb-4 text-purple-400 opacity-50" />
                <p className="text-purple-200 text-lg">No timetable yet. Generate one from Setup tab.</p>
              </div>
            )}
            
            {activeTab === 'analysis' && metrics && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-white/20">
                    <h3 className="text-xl font-bold text-white mb-4">Brooks' Theorem</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="text-cyan-300 text-sm mb-1">Lower Bound (Δ)</div>
                        <div className="text-5xl font-bold text-white">{metrics.delta}</div>
                        <div className="text-cyan-400 text-xs mt-1">χ(G) ≤ Δ for non-clique graphs</div>
                      </div>
                      <div>
                        <div className="text-cyan-300 text-sm mb-1">Slots Used</div>
                        <div className="text-4xl font-bold text-white">{metrics.slotsUsed}</div>
                        <div className={text-xs mt-1 ${metrics.slotsUsed <= metrics.delta + 1 ? 'text-green-400' : 'text-red-400'}}>
                          {metrics.slotsUsed <= metrics.delta + 1 ? '✓ Within Brooks bound' : '✗ Exceeds bound'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-white/20">
                    <h3 className="text-xl font-bold text-white mb-4">Hajnal-Szemerédi</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-emerald-300 text-xs mb-1">Max/Slot</div>
                        <div className="text-3xl font-bold text-white">{metrics.maxSlotSize}</div>
                      </div>
                      <div>
                        <div className="text-emerald-300 text-xs mb-1">Min/Slot</div>
                        <div className="text-3xl font-bold text-white">{metrics.minSlotSize}</div>
                      </div>
                      <div>
                        <div className="text-emerald-300 text-xs mb-1">Imbalance</div>
                        <div className={text-3xl font-bold ${metrics.imbalance <= 1 ? 'text-green-400' : 'text-orange-400'}}>
                          {metrics.imbalance}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-emerald-300 text-sm">
                      Average: <span className="font-bold text-white">{metrics.avgSlotSize}</span> courses/slot
                    </div>
                    <div className={mt-2 text-xs ${metrics.imbalance <= 1 ? 'text-green-400' : 'text-orange-400'}}>
                      {metrics.imbalance <= 1 ? '✓ Equitable coloring achieved' : '○ Can be improved'}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-4">Hall's Marriage Theorem</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-purple-300 text-sm mb-2">Room Utilization</div>
                      <div className="text-5xl font-bold text-white">{metrics.roomUtilization}%</div>
                      <div className="text-purple-400 text-xs mt-1">Capacity efficiency</div>
                    </div>
                    <div>
                      <div className="text-purple-300 text-sm mb-2">Unassigned Courses</div>
                      <div className={text-5xl font-bold ${metrics.unassignedCourses === 0 ? 'text-green-400' : 'text-red-400'}}>
                        {metrics.unassignedCourses}
                      </div>
                      <div className={text-xs mt-1 ${metrics.unassignedCourses === 0 ? 'text-green-400' : 'text-red-400'}}>
                        {metrics.unassignedCourses === 0 ? '✓ Perfect matching found' : '✗ Hall condition violated'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/5 border border-white/20 rounded-xl p-5 flex items-center justify-between">
                  <span className="text-purple-200 font-semibold text-lg">Computation Time</span>
                  <span className="text-3xl font-bold text-white">{metrics.computeTime} <span className="text-lg text-purple-300">ms</span></span>
                </div>
              </div>
            )}
            
            {activeTab === 'analysis' && !metrics && (
              <div className="text-center py-20">
                <BarChart3 className="w-20 h-20 mx-auto mb-4 text-purple-400 opacity-50" />
                <p className="text-purple-200 text-lg">No analysis available. Generate a timetable first.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}  Store this and run da...THis is the max i can do
