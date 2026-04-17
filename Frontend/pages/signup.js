import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Signup(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");

  const signup=async()=>{
    await supabase.auth.signUp({email,password});
    alert("Check email");
  };

  return(
    <div>
      <input onChange={e=>setEmail(e.target.value)} />
      <input type="password" onChange={e=>setPassword(e.target.value)} />
      <button onClick={signup}>Signup</button>
    </div>
  );
}